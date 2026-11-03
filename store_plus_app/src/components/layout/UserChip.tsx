import { USER_NAME } from '../../data/user'

const initials = USER_NAME.split(/\s+/)
  .map((w) => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

/** Signed-in user's avatar and name at the right of the top bar. */
export default function UserChip() {
  return (
    <div className="user-chip" title={USER_NAME}>
      <span className="avatar" aria-hidden>
        {initials}
      </span>
      <span className="name">{USER_NAME}</span>
    </div>
  )
}
