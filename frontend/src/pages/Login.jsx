import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { useAuth } from '../context/useAuth'

const Login = () => {
  // login page that allows users to sign in with their email and password, and handles redirection based on invite tokens or dashboard access
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginUser(formData)
      login(response)
      const inviteToken = searchParams.get('invite')
      navigate(inviteToken ? `/board-invites/${inviteToken}` : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#111214] px-4 py-10'>
      <div className='w-full max-w-md rounded-2xl border border-[#34363a] bg-[#202225] p-8 shadow-2xl'>
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white'>
            trello
          </div>

          <h1 className='text-2xl font-semibold tracking-tight text-white'>Welcome back</h1>
          <p className='mt-2 text-sm text-white/55'>Sign in to continue to your account</p>
          {location.state?.message && <p className='mt-4 rounded-md bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200'>{location.state.message}</p>}
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label htmlFor='email' className='mb-2 block text-sm font-medium text-white/80'>Email address</label>
          
            {/* // input field for email address with styling and validation */}
            <input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='Enter your email'
              className='w-full rounded-xl border border-[#34363a] bg-[#0d0e10] px-3.5 py-2.5 text-white outline-none transition placeholder:text-white/35 focus:border-[#5798f5] focus:ring-2 focus:ring-[#5798f5]/30'
              required
            />
          </div>

          {/* //forgot password link and password input field with show/hide functionality */}
          <div>
            <div className='mb-2 flex items-center justify-between gap-3'>
              <label htmlFor='password' className='text-sm font-medium text-white/80'>Password</label>
              <button type='button' onClick={() => navigate('/forgot-password')} className='text-[10px] font-medium text-blue-600 transition hover:text-blue-700 cursor-pointer'>
                Forgot password?
              </button>
            </div>

            <div className='relative'>
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter your password'
                className='w-full rounded-xl border border-[#34363a] bg-[#0d0e10] px-3.5 py-2.5 pr-11 text-white outline-none transition placeholder:text-white/35 focus:border-[#5798f5] focus:ring-2 focus:ring-[#5798f5]/30'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute inset-y-0 right-3 flex items-center text-xs font-medium text-blue-600 transition hover:text-blue-700 cursor-pointer'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className='text-sm text-red-300'>{error}</p>}

          {/* //sigin button with loading state */}
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer disabled:opacity-60'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* //moving to the register page if the user doesn't have an account */}
        <p className='mt-6 text-center text-sm text-white/55'>
          Don’t have an account?{' '}
          <button
            type='button'
            onClick={() => navigate('/register')}
            className='font-semibold text-blue-600 transition hover:text-blue-700 cursor-pointer'
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
