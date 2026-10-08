import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { acceptBoardInvite } from '../../services/inviteService'
import { useAuth } from '../../context/useAuth'
import ThemeToggle from '../../components/common/ThemeToggle'

const BoardInvite = () => {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const cardId = searchParams.get('cardId')
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
      const targetCardId = response.data?.cardId || cardId
      const targetUrl = `/boards/${response.data.board._id}${targetCardId ? `?cardId=${targetCardId}` : ''}`
      setTimeout(() => navigate(targetUrl), 600)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to accept invitation')
      setStatus('error')
    }
  }

  // board invitation page that allows users to accept an invitation to collaborate on a board
  return (
    <main className='relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 transition-colors dark:bg-[#111214]'>
      <div className='absolute top-5 right-5'>
        <ThemeToggle />
      </div>

      <section className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl transition-colors dark:border-[#383a40] dark:bg-[#202225]'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-md shadow-blue-500/20 dark:bg-[#5798f5]'>✉</div>
        <h1 className='mt-5 text-2xl font-semibold text-slate-900 dark:text-white'>Board invitation</h1>
        <p className='mt-2 text-sm text-slate-500 dark:text-white/60'>Accept this invitation to collaborate on the board.</p>

        {!user ? (
          <div className='mt-6 space-y-3'>
            <p className='text-sm text-amber-600 dark:text-amber-200'>Sign in with the invited email address before accepting.</p>
            <Link to={`/login?invite=${token}${cardId ? `&cardId=${cardId}` : ''}`} className='block rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-[#5798f5]'>Sign in</Link>
            <Link to={`/register?invite=${token}${cardId ? `&cardId=${cardId}` : ''}`} className='block rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-transparent dark:bg-white/10 dark:text-white/80'>Create account</Link>
          </div>
        ) : (
          <button type='button' onClick={handleAccept} disabled={status === 'loading' || status === 'success'} className='mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-[#5798f5]'>
            {status === 'loading' ? 'Accepting...' : status === 'success' ? 'Accepted' : 'Accept invitation'}
          </button>
        )}

        {message && <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{message}</p>}
      </section>
    </main>
  )
}

export default BoardInvite
