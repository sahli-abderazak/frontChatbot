"use client"

import { useState } from "react"
import { DashboardHeaderRec } from "../components/recruteur/dashboard-header_rec"
import { DashboardSidebarRec } from "../components/recruteur/dashboard-sidebar_rec"
import { AddOffreForm } from "../components/offre/add-offre-form"
import { OffreTabs } from "../components/offre/offre-tabs"

export default function OffrePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(false)

  const handleOffreAdded = () => {
    setRefreshTrigger((prev) => !prev) // Inverse la valeur pour déclencher un rafraîchissement
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeaderRec />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="hidden md:block md:col-span-1 lg:col-span-1">
            <div className="sticky top-20">
              <DashboardSidebarRec />
            </div>
          </div>
          <div className="md:col-span-5 lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Offres d'emplois</h1>
                <p className="text-muted-foreground">Gérer les offres d'emplois</p>
              </div>
              <AddOffreForm onOffreAdded={handleOffreAdded} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <OffreTabs refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}