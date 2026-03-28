'use client'

import * as React from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useSocket } from '@/app/context/SocketContext'
import { useToast } from '@/app/context/ToastContext'
import { useTicketPage } from './hooks/useTicketPage'
import LoadingError from './components/LoadingError'
import TicketHeader from './components/TicketHeader'
import TicketDetails from './components/TicketDetails'
import AdminActionsSection from './components/AdminActionsSection'
import MDActionsSection from './components/MDActionsSection'
import ServiceTeamActionsSection from './components/ServiceTeamActionsSection'
import AdminWorkSection from './components/AdminWorkSection'
import CloseTicketButton from './components/CloseTicketButton'
import StatusTimeline from './components/StatusTimeline'
import ReviewsSection from './components/ReviewsSection'
import DashboardLayout from '@/app/components/layouts/DashboardLayout'

export default function PublicTicketPage({ params }) {
  // Unwrap params (Next.js 15+)
  const { ticketId } = React.use(params)

  const { user } = useAuth()
  const { socket, joinTicket, leaveTicket } = useSocket()
  const toast = useToast()

  const {
    ticket,
    loading,
    error,
    review,
    setReview,
    submitting,
    showActions,
    selectedAction,
    setSelectedAction,
    mdDecision,
    setMdDecision,
    mdReview,
    setMdReview,
    thirdPartyDetails,
    setThirdPartyDetails,
    thirdPartyStatus,
    setThirdPartyStatus,
    adminReview,
    setAdminReview,
    serviceTeamMembers,
    selectedServiceUserId,
    setSelectedServiceUserId,
    serviceResponse,
    setServiceResponse,
    serviceDecision,
    setServiceDecision,
    fetchTicket,
    handleAdminAction,
    handleServiceResponse,
    handleServiceWorkUpdate,
    handleMDDecision,
    handleWorkUpdate,
    handleCloseTicket,
  } = useTicketPage({ ticketId, user, socket, joinTicket, leaveTicket, toast })

  // Render loading or error
  if (loading) {
    return <LoadingError loading={true} />
  }

  if (error || !ticket) {
    return <LoadingError error={error || 'Ticket not found'} />
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const isMD = user?.role === 'MD'
  const isServiceTeam = user?.role === 'SERVICE_TEAM'
  const isEmployee = user?.role === 'EMPLOYEE' && user?.id === ticket.createdBy?.id
  const canView = isAdmin || isMD || isEmployee || !user

  if (!canView) {
    return <LoadingError error="Access Denied" showLogin />
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <TicketHeader ticket={ticket} />

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <TicketDetails ticket={ticket} />

          <AdminActionsSection
            isAdmin={isAdmin}
            ticket={ticket} 
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            adminReview={adminReview}
            setAdminReview={setAdminReview}
            thirdPartyDetails={thirdPartyDetails}
            setThirdPartyDetails={setThirdPartyDetails}
            thirdPartyStatus={thirdPartyStatus}
            setThirdPartyStatus={setThirdPartyStatus}
            serviceTeamMembers={serviceTeamMembers}
            selectedServiceUserId={selectedServiceUserId}
            setSelectedServiceUserId={setSelectedServiceUserId}
            handleAdminAction={handleAdminAction}
            submitting={submitting}
          />

          <MDActionsSection
            isMD={isMD}
            ticket={ticket}
            mdDecision={mdDecision}
            setMdDecision={setMdDecision}
            mdReview={mdReview}
            setMdReview={setMdReview}
            handleMDDecision={handleMDDecision}
            submitting={submitting}
          />

          <ServiceTeamActionsSection
            isServiceTeam={isServiceTeam}
            ticket={ticket}
            serviceDecision={serviceDecision}
            setServiceDecision={setServiceDecision}
            serviceResponse={serviceResponse}
            setServiceResponse={setServiceResponse}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            handleServiceResponse={handleServiceResponse}
            handleServiceWorkUpdate={handleServiceWorkUpdate}
            submitting={submitting}
          />

          <AdminWorkSection
            isAdmin={isAdmin}
            ticket={ticket}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            review={review}
            setReview={setReview}
            handleWorkUpdate={handleWorkUpdate}
            submitting={submitting}
          />

          <CloseTicketButton
            isAdmin={isAdmin}
            isEmployee={isEmployee}
            ticket={ticket}
            handleCloseTicket={handleCloseTicket}
            submitting={submitting}
          />

          <StatusTimeline history={ticket.history} />

          <ReviewsSection
            user={user}
            review={review}
            setReview={setReview}
            handleAdminAction={handleAdminAction}
            submitting={submitting}
            reviews={ticket.reviews}
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Ticket Management System • Share this link with authorized personnel</p>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}