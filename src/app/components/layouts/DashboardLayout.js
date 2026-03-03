import { useState } from 'react'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 lg:ml-4 mt-12">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}