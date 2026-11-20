/** The open Pulse conversation, remembered in this browser so a page reload brings it back. */
const KEY = 'storepulse.pulse.thread'

export function readLastThread(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null // storage blocked (private window, site data off): start fresh
  }
}

export function rememberThread(id: string): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // storage blocked: the conversation is still saved on the server and listed in History
  }
}
