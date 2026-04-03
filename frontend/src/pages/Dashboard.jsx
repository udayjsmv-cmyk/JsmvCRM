// src/pages/Dashboard.jsx
import React from 'react'
import { getUser } from '../utils/auth'
import AdminPanel from './panels/AdminPanel'
import ManagerPanel from './panels/ManagerPanel'
import TLPanel from './panels/TLPanel'
import EmployeePanel from './panels/EmployeePanel'

const Dashboard = () => {
  const user = getUser()
  if (!user) return <p>Loading...</p>

  switch (user.role) {
    case 'admin':
      return <AdminPanel getUser={() => user} />

    case 'manager':
      return <ManagerPanel getUser={() => user} />

    case 'teamlead':
      return <TLPanel getUser={() => user} />

    case 'employee':
      return <EmployeePanel getUser={() => user} />

    default:
      return <p className="text-red-500 font-semibold">Unauthorized Role</p>
  }
}

export default Dashboard
