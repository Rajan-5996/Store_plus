import { createAsyncThunk, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import { apiGet, apiStream } from '@/lib/api'
import type { ChatTurnApi } from '@/types/api'
import { deleteThread } from './historySlice'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  text: string
  /** Names of the tools the agent used to produce an answer (skills read, SQL run, ...). */
  tools?: string[]
}

interface ChatState {
  messages: ChatMessage[]
  status: 'idle' | 'loading'
  /** Live progress lines of the question being answered ("Reading the profitability skill", ...). */
  steps: string[]
  /** The open conversation: the server saves its turns under this id (History reopens older ones). */
  threadId: string
  /** Dashboard screen the conversation is about ('all' = let the agent pick from the question). */
  focus: string
}

const initialState: ChatState = { messages: [], status: 'idle', steps: [], threadId: nanoid(), focus: 'all' }

interface ChatReply {
  answer: string
  tools: string[]
}

type StreamEvent =
  | { type: 'step'; text: string }
  | ({ type: 'answer' } & ChatReply)
  | { type: 'error'; message: string }

/** `screen` is the dashboard page the question is asked on (e.g. 'overview'), so the agent starts in the right domain. */
export const sendMessage = createAsyncThunk(
  'chat/send',
  async ({ text, screen }: { text: string; screen: string }, { getState, dispatch }) => {
    const { chat } = getState() as { chat: ChatState }
    let reply: ChatReply | null = null
    // the agent streams a progress line per step, then the final answer
    await apiStream<StreamEvent>('/api/agent/chat/stream', { message: text, thread_id: chat.threadId, screen }, (e) => {
      if (e.type === 'step') dispatch(addStep(e.text))
      else if (e.type === 'answer') reply = { answer: e.answer, tools: e.tools }
      else throw new Error(e.message)
    })
    if (!reply) throw new Error('The agent stopped without an answer. Please try again.')
    return reply as ChatReply
  },
)

/** Loads a saved conversation and makes it the open one, so the next question carries on from it. */
export const openThread = createAsyncThunk('chat/open', (id: string) =>
  apiGet<ChatTurnApi[]>(`/api/agent/threads/${encodeURIComponent(id)}`),
)

const toMessages = (id: string, turns: ChatTurnApi[]): ChatMessage[] =>
  turns.flatMap((t, i) => [
    { id: `${id}-${i}-q`, role: 'user' as const, text: t.question },
    { id: `${id}-${i}-a`, role: 'assistant' as const, text: t.answer, tools: t.tools },
  ])

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addStep: (s, a: PayloadAction<string>) => {
      s.steps.push(a.payload)
    },
    clearChat: (s) => {
      s.messages = []
      s.threadId = nanoid() // a new thread forgets the old conversation
    },
    setChatFocus: (s, a: PayloadAction<string>) => {
      s.focus = a.payload
    },
  },
  extraReducers: (b) => {
    b.addCase(sendMessage.pending, (s, a) => {
      s.status = 'loading'
      s.steps = []
      s.messages.push({ id: a.meta.requestId, role: 'user', text: a.meta.arg.text })
    })
    b.addCase(sendMessage.fulfilled, (s, a) => {
      s.status = 'idle'
      s.steps = []
      s.messages.push({ id: `${a.meta.requestId}-a`, role: 'assistant', text: a.payload.answer, tools: a.payload.tools })
    })
    b.addCase(sendMessage.rejected, (s, a) => {
      s.status = 'idle'
      s.steps = []
      s.messages.push({ id: `${a.meta.requestId}-e`, role: 'error', text: a.error.message ?? 'The agent could not answer.' })
    })
    b.addCase(openThread.pending, (s, a) => {
      s.threadId = a.meta.arg
      s.messages = []
      s.steps = []
    })
    b.addCase(openThread.fulfilled, (s, a) => {
      if (s.threadId !== a.meta.arg) return // another conversation was opened meanwhile
      s.messages = [...toMessages(a.meta.arg, a.payload), ...s.messages] // a question asked while it loaded stays last
    })
    b.addCase(openThread.rejected, (s, a) => {
      if (s.threadId !== a.meta.arg) return
      s.messages.push({ id: `${a.meta.requestId}-e`, role: 'error', text: `Could not load this conversation: ${a.error.message ?? 'server error'}` })
    })
    b.addCase(deleteThread.fulfilled, (s, a) => {
      if (s.threadId !== a.payload) return
      s.messages = [] // the open conversation was deleted: start a fresh one
      s.threadId = nanoid()
    })
  },
})

export const { addStep, clearChat, setChatFocus } = chatSlice.actions
export default chatSlice.reducer
