import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  sub: ReactNode
}

export default function ScreenHeader({ title, sub }: Props) {
  return (
    <>
      <h1>{title}</h1>
      <p className="sub">{sub}</p>
    </>
  )
}
