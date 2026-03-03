'use client'
import Login from "../pages/auth/login";

export default function LoginPage() {
    return(
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Optional: Add a header or background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-primary-600 to-primary-800 transform -skew-y-6"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <Login />
      </div>
    </div>
    )
}