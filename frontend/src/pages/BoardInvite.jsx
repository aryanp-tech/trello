import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { acceptBoardInvite } from '../services/inviteService'
import { useAuth } from '../context/useAuth'

const BoardInvite = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState('ready')
  const [message, setMessage] = useState('')

  const handleAccept = async () => {
    try {
      setStatus('loading')
      const response = await acceptBoardInvite(token)
      setMessage(response.data.message)
      setStatus('success')
      setTimeout(() => navigate(`/boards/${response.data.board._id}`), 600)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to accept invitation')
      setStatus('error')
    }
  }

  // board invitation page that allows users to accept an invitation to collaborate on a board
  return (
    <main className='flex min-h-screen items-center justify-center bg-[#111214] px-4 text-white'>
      <section className='w-full max-w-md rounded-xl border border-[#383a40] bg-[#202225] p-7 text-center shadow-xl'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#5798f5] text-2xl'>✉</div>
        <h1 className='mt-5 text-2xl font-semibold'>Board invitation</h1>
        <p className='mt-2 text-sm text-white/60'>Accept this invitation to collaborate on the board.</p>

        {!user ? (
          <div className='mt-6 space-y-3'>
            <p className='text-sm text-amber-200'>Sign in with the invited email address before accepting.</p>
            <Link to={`/login?invite=${token}`} className='block rounded-md bg-[#5798f5] px-4 py-2 text-sm font-semibold'>Sign in</Link>
            <Link to={`/register?invite=${token}`} className='block rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white/80'>Create account</Link>
          </div>
        ) : (
          <button type='button' onClick={handleAccept} disabled={status === 'loading' || status === 'success'} className='mt-6 rounded-md bg-[#5798f5] px-5 py-2 text-sm font-semibold disabled:opacity-60'>
            {status === 'loading' ? 'Accepting...' : status === 'success' ? 'Accepted' : 'Accept invitation'}
          </button>
        )}

        {message && <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p>}
      </section>
    </main>
  )
}

export default BoardInvite
