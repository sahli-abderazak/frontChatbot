"use client"
import { DashboardSidebarRec } from "../components/recruteur/dashboard-sidebar_rec"
import { DashboardHeaderRec } from "../components/recruteur/dashboard-header_rec"
import ChatPage from "../components/chat/chat-page"

export default function ChatRecPage() {
  return (
    
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
       <DashboardHeaderRec />
        <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Sidebar */}
            <div className="hidden md:block md:col-span-1 lg:col-span-1">
              <div className="sticky top-20">
                <DashboardSidebarRec />
              </div>
            </div>
  
            {/* Main Content */}
            <div className="md:col-span-5 lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Disscusion</h1>
                  <p className="text-muted-foreground">Suivre les message de admin</p>
                </div>   
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <ChatPage />
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}