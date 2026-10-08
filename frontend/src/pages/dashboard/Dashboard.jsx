import { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import DashboardHome from '../../components/dashboard/DashboardHome'

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
