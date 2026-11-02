import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { storePath } from '@/lib/storePath'

/** A store code that opens that store's page. */
export default function StoreLink({ code, children, chip }: { code: string; children?: ReactNode; chip?: boolean }) {
  return (
    <Link
      to={storePath(code)}
      className={chip ? 'rec-chip' : 'font-bold text-brand underline-offset-2 hover:underline'}
      onClick={(e) => e.stopPropagation()}
    >
      {children ?? code}
    </Link>
  )
}
