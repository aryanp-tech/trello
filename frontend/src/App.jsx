import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/auth/login/Login'
import Register from './pages/auth/register/Register'
import Dashboard from './pages/dashboard/Dashboard'
import BoardWorkspace from './components/board/BoardWorkspace'
import Profile from './pages/profile/Profile'
import BoardInvite from './pages/board-invite/BoardInvite'
import ForgotPassword from './pages/auth/forgot-password/ForgotPassword'
import ResetPassword from './pages/auth/reset-password/ResetPassword'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/useAuth'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return children
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
         
          {/* // Redirect root path to login page */}
          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* // Route for board invitation page */}
          <Route path='/board-invites/:token' element={<BoardInvite />} />

          {/* // Routes for password reset functionality */}
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} />

          {/* // Protected routes for authenticated users */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* // Protected route for board workspace, accessible only to authenticated users */}
          <Route
            path='/boards/:boardId'
            element={
              <ProtectedRoute>
                <BoardWorkspace />
              </ProtectedRoute>
            }
          />

          {/* // Protected route for user profile, accessible only to authenticated users */}
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
