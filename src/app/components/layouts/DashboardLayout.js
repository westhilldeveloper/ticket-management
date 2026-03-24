import { useState } from 'react'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // new state

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed} // pass down control
        />
        
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out
            mt-16 /* navbar height */
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
          `}
        >
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}