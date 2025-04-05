"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Eye, X, Trash } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReviewsTable } from "./employee-table"
import { UserDetailsDialog } from "./UserDetailsDialog"
import "../styles/employee-cards.css"

interface User {
  id: number
  nom: string
  prenom: string
  email: string
  created_at: string
  departement: string
  numTel: string
  poste: string
  adresse: string
  image?: string
  cv?: string
  nom_societe: string
  domaine_activite?: string
}

export function ReviewsTabs({ refreshTrigger }: { refreshTrigger: boolean }) {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showResults, setShowResults] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [userToArchive, setUserToArchive] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Charger tous les utilisateurs au démarrage
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("http://127.0.0.1:8000/api/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des utilisateurs")
        }

        const data = await response.json()
        setAllUsers(data)
      } catch (error) {
        console.error("Erreur de chargement des utilisateurs:", error)
      }
    }

    fetchAllUsers()
  }, [refreshTrigger])

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fonction de recherche par nom de société
  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    setLoading(true)
    setShowResults(true)

    if (value.length < 1) {
      setSearchResults([])
      setShowResults(false)
      setSelectedUser(null)
      setLoading(false)
      return
    }

    try {
      // Filtrer directement les utilisateurs qui contiennent la lettre saisie
      const searchLower = value.toLowerCase()
      const filteredResults = allUsers.filter((user) => {
        return user.nom_societe?.toLowerCase().includes(searchLower)
      })
      setSearchResults(filteredResults)
    } catch (error) {
      console.error("Erreur de recherche:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Get initials for avatar
  const getInitials = (nom: string, prenom: string) => {
    const firstNameInitial = prenom && prenom.length > 0 ? prenom.charAt(0) : ""
    const lastNameInitial = nom && nom.length > 0 ? nom.charAt(0) : ""
    return `${firstNameInitial}${lastNameInitial}`.toUpperCase()
  }

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setShowResults(false)
    // Set the company name in the search bar
    setSearchTerm(user.nom_societe || "")
  }

  // Clear search and selected user
  const clearSearch = () => {
    setSearchTerm("")
    setSelectedUser(null)
    setSearchResults([])
    setShowResults(false)
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDetailsOpen(true)
  }

  const archiveUser = async (userId: number) => {
    setUserToArchive(userId)
    setIsArchiveDialogOpen(true)
  }

  const confirmArchive = async () => {
    if (!userToArchive) return

    const token = localStorage.getItem("token")
    if (!token) {
      setIsArchiveDialogOpen(false)
      return
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/archive/${userToArchive}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'archivage de l'utilisateur")
      }

      setAllUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToArchive))

      // If the archived user is the selected user, clear the selection
      if (selectedUser && selectedUser.id === userToArchive) {
        setSelectedUser(null)
        setSearchTerm("")
      }

      setIsArchiveDialogOpen(false)
      setUserToArchive(null)
    } catch (error) {
      console.error("Erreur lors de l'archivage de l'utilisateur:", error)
      setIsArchiveDialogOpen(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un recruteur par nom de société..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= 1 && setShowResults(true)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {loading && (
            <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg p-4 text-center">
              Recherche en cours...
            </div>
          )}

          {showResults && !loading && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image || `/placeholder.svg?height=32&width=32`}
                        alt={user.nom_societe || "Logo société"}
                      />
                      <AvatarFallback>{user.nom_societe?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-sm text-black">{user.nom_societe || "Société non spécifiée"}</div>
                </div>
              ))}
            </div>
          )}

          {showResults && !loading && searchResults.length === 0 && searchTerm.length >= 1 && (
            <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg p-4 text-center">
              Aucun recruteur trouvé
            </div>
          )}
        </div>
      </div>

      {selectedUser ? (
        <div className="cards-grid">
          <Card className="user-card">
            <div className="card-header"></div>
            <div className="avatar-container">
              <Avatar className="user-avatar">
                <AvatarImage
                  src={selectedUser.image || `/placeholder.svg?height=96&width=96`}
                  alt={selectedUser.nom_societe}
                />
                <AvatarFallback className="avatar-fallback">{selectedUser.nom_societe?.[0]}</AvatarFallback>
              </Avatar>
            </div>

            <CardContent className="card-content">
              <h3 className="user-name">{selectedUser.nom_societe}</h3>
              <Badge className="user-badge">{selectedUser.domaine_activite || "info"}</Badge>

              <div className="user-details">
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span
                    className="detail-value email-link"
                    onClick={() =>
                      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedUser.email}`, "_blank")
                    }
                  >
                    {selectedUser.email}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Téléphone:</span>
                  <span className="detail-value">{selectedUser.numTel || "Non spécifié"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Inscrit le:</span>
                  <span className="detail-value">
                    {new Intl.DateTimeFormat("fr-FR").format(new Date(selectedUser.created_at))}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="card-footer">
              <Button
                variant="outline"
                className="action-button view-button"
                onClick={() => handleViewDetails(selectedUser)}
              >
                <Eye className="button-icon" />
                Détails
              </Button>
              <Button
                variant="outline"
                className="action-button archive-button"
                onClick={() => archiveUser(selectedUser.id)}
              >
                <Trash className="button-icon" />
                Archiver
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="recruteur" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="recruteur"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              Recruteurs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recruteur" className="p-6">
            <ReviewsTable refresh={refreshTrigger} />
          </TabsContent>
        </Tabs>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="archive-dialog-title">Confirmation d'archivage</DialogTitle>
            <DialogDescription className="archive-dialog-description">
              Êtes-vous sûr de vouloir archiver cet utilisateur ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="archive-dialog-footer flex flex-row justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={confirmArchive}>
              Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      {selectedUser && (
        <UserDetailsDialog user={selectedUser} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      )}
    </div>
  )
}