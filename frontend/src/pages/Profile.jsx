import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Profile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const initial = user?.username?.charAt(0)?.toUpperCase() || 'U'

  return (
    // profile page that displays the user's account information, including their username and email address, with a close button to navigate back to the previous page
    <main className='min-h-screen bg-[#111214] px-4 py-8 text-white'>
      <div className='mx-auto max-w-xl'>
      
        <button type='button' onClick={() => navigate(-1)} className='mb-8 flex items-center gap-2 rounded-md bg-[#2b2d31] px-3 py-2 text-sm text-white/80 hover:bg-[#373a40]'>
          <span aria-hidden='true'>×</span>
          Close
        </button>

        {/* // user profile card that displays the user's initial */}
        <section className='overflow-hidden rounded-2xl border border-[#383a40] bg-[#202225]'>
          <div className='h-28 bg-gradient-to-r from-[#24558b] to-[#713d77]' />
          <div className='px-6 pb-7'>
            <div className='-mt-14 flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#202225] bg-[#c45aa9] text-4xl font-bold text-white'>
              {initial}
            </div>
            <h1 className='mt-5 text-2xl font-semibold'>{user?.username || 'User'}</h1>
            <p className='mt-1 text-sm text-white/55'>Account profile</p>

            {/* // displays the user's email address or a message if no email is available */}
            <div className='mt-8 border-t border-[#383a40] pt-5'>
              <p className='text-xs font-semibold uppercase tracking-wide text-white/45'>Email address</p>
              <p className='mt-2 text-base text-white/85'>{user?.email || 'No email available'}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Profile
