import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BoardWorkspace from './components/BoardWorkspace'
import Profile from './pages/Profile'
import BoardInvite from './pages/BoardInvite'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return children
}

const App = () => {
  return (
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
  )
}

export default App
