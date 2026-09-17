import Navbar from '../components/Navbar'
import DashboardHome from '../components/DashboardHome'

const Dashboard = () => {

  // dashboard page that displays the user's boards and allows them to create, edit, or delete boards
  return (
    <div>
      <Navbar />
      <DashboardHome />
    </div>
  )
}

export default Dashboard
