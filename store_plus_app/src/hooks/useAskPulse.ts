import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { PULSE_FOCUS } from '@/data/pulse'
import { sendMessage, setChatFocus } from '@/features/chat/chatSlice'

/**
 * Opens the Pulse AI page focused on the screen the user is on; with a question, also sends it.
 * The conversation lives in Redux, so it carries over from any page.
 */
export function useAskPulse() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const here = useLocation().pathname.replace('/', '')

  return useCallback(
    (question?: string) => {
      const focus = (PULSE_FOCUS as readonly string[]).includes(here) ? here : 'all'
      if (here !== 'pulse') dispatch(setChatFocus(focus))
      if (question) void dispatch(sendMessage({ text: question, screen: focus === 'all' ? '' : focus }))
      navigate('/pulse')
    },
    [dispatch, navigate, here],
  )
}
