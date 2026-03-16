import { AuthProvider } from './context/AuthContext'
import { AppRouter } from './router/AppRouter'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRouter />
    </AuthProvider>
  )
}

export default App
