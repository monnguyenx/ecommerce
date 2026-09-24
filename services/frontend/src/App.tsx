import { useState, useEffect } from 'react'
import type { User } from './types/auth'
import { authApi } from './services/authApi'
import { LoginPage } from './pages/LoginPage'
import { DashboardPreview } from './pages/DashboardPreview'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Khôi phục phiên làm việc nếu đã lưu
    const savedUser = authApi.getStoredUser()
    if (savedUser) {
      setCurrentUser(savedUser)
    }
    setIsInitializing(false)
  }, [])

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    authApi.logout()
    setCurrentUser(null)
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
        Đang tải hệ thống...
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-900 antialiased font-sans">
      {currentUser ? (
        <DashboardPreview user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default App
