import { Routes, Route } from 'react-router-dom'
import { LiveCodeLanding } from '../../features/livecode/components/LiveCodeLanding'
import { LiveCodeRoomPage } from '../../features/livecode/LiveCodeRoomPage'
import '../../features/livecode/livecode.css'

export function LiveCodePage() {
  return (
    <div className="livecode-root">
      <Routes>
        <Route index element={<LiveCodeLanding />} />
        <Route path=":roomId" element={<LiveCodeRoomPage />} />
      </Routes>
    </div>
  )
}
