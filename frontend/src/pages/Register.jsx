import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { registerUser } from '../services/authService'
import { useAuth } from '../context/useAuth'

const Register = () => {

  // register page that allows users to create a new account with username, email, and password, and handles redirection based on invite tokens or dashboard access

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
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
      const inviteToken = searchParams.get('invite')
      const response = await registerUser({ ...formData, inviteToken: inviteToken || undefined })
      login(response.data)
      navigate(response.data.boardId ? `/boards/${response.data.boardId}` : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed')
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
          <h1 className='text-2xl font-semibold tracking-tight text-white'>Create account</h1>
          <p className='mt-2 text-sm text-white/55'>Sign up to get started</p>
        </div>
 
       {/* //registration form that collects username, email, and password from the user, with validation and error handling */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label htmlFor='username' className='mb-2 block text-sm font-medium text-white/80'>Username</label>
            <input
              id='username'
              name='username'
              type='text'
              value={formData.username}
              onChange={handleChange}
              placeholder='Enter your username'
              className='w-full rounded-xl border border-[#34363a] bg-[#0d0e10] px-3.5 py-2.5 text-white outline-none transition placeholder:text-white/35 focus:border-[#5798f5] focus:ring-2 focus:ring-[#5798f5]/30'
              required
            />
          </div>

          <div>
            <label htmlFor='email' className='mb-2 block text-sm font-medium text-white/80'>Email address</label>
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

          <div>
            <div className='mb-2 flex items-center justify-between gap-3'>
              <label htmlFor='password' className='text-sm font-medium text-white/80'>Password</label>
              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                className='text-[10px] font-medium text-blue-600 transition hover:text-blue-700'
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <input
              id='password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter your password'
              className='w-full rounded-xl border border-[#34363a] bg-[#0d0e10] px-3.5 py-2.5 text-white outline-none transition placeholder:text-white/35 focus:border-[#5798f5] focus:ring-2 focus:ring-[#5798f5]/30'
              required
            />
          </div>

          {error && <p className='text-sm text-red-300'>{error}</p>}

            {/* //sign up button with loading state */}
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60'
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {/* // link to return to the login page if the user already has an account */}
        <p className='mt-6 text-center text-sm text-white/55'>
          Already have an account?{' '}
          <Link to='/login' className='font-semibold text-blue-600 transition hover:text-blue-700'>
            Go to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
