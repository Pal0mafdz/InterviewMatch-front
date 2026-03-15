import { type ReactNode } from 'react'

interface Win98WindowProps {
  title: string
  children: ReactNode
  width?: string | number
}

export function Win98Window({ title, children, width = 800 }: Win98WindowProps) {
  return (
    <div className="window" style={{ width, margin: '20px auto' }}>
      <div className="title-bar">
        <div className="title-bar-text">InterviewMatch — {title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        {children}
      </div>
    </div>
  )
}
