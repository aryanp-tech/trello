import { useState } from 'react'
import Navbar from '../components/Navbar'
import DashboardHome from '../components/DashboardHome'

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')

  // dashboard page that displays the user's boards and allows them to create, edit, or delete boards
  return (
    <div>
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <DashboardHome searchQuery={searchQuery} />
    </div>
  )
}

export default Dashboard
