import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService'

const ForgotPassword = () => {
    // forgot password page that allows users to request a password reset link by entering their email address
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await requestPasswordReset(email)
      navigate('/login', {
        state: { message: response.data.message },
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-[#111214] px-4 py-10 text-white'>
      <section className='w-full max-w-md rounded-2xl border border-[#34363a] bg-[#202225] p-8 shadow-2xl'>
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5798f5] text-xl font-bold'>↗</div>
          <h1 className='text-2xl font-semibold'>Forgot password?</h1>
          <p className='mt-2 text-sm text-white/55'>Enter your email and we will send you a secure reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <input type='email' value={email} onChange={(event) => setEmail(event.target.value)} placeholder='Email address' className='w-full rounded-xl border border-[#45474d] bg-[#17181a] px-3.5 py-3 text-sm text-white outline-none focus:border-[#5798f5]' required />
          {error && <p className='rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-200'>{error}</p>}
          <button type='submit' disabled={loading} className='w-full rounded-xl bg-[#5798f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4387e8] disabled:opacity-60'>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {/* // link to return to the login page */}
        <Link to='/login' className='mt-6 block text-center text-sm text-[#65a6ff] hover:underline'>Return to sign in</Link>
      </section>
    </main>
  )
}

export default ForgotPassword
