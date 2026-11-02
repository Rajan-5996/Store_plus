import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { clearChat } from '@/features/chat/chatSlice'
import { useUI } from '../../context/UIContext'
import ChatInput from './chat/ChatInput'
import ChatMessages from './chat/ChatMessages'

/** The Pulse AI side drawer: a chat with the backend agent. */
export default function AskDrawer() {
  const { drawerOpen, closeDrawer } = useUI()
  const dispatch = useAppDispatch()
  const hasMessages = useAppSelector((s) => s.chat.messages.length > 0)
  return (
    <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-label="Pulse AI">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Pulse AI</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {hasMessages && (
            <button className="btn ghost" type="button" onClick={() => dispatch(clearChat())}>
              New chat
            </button>
          )}
          <button className="btn ghost" type="button" onClick={closeDrawer}>
            Close
          </button>
        </div>
      </div>
      <ChatMessages />
      <ChatInput />
    </aside>
  )
}
