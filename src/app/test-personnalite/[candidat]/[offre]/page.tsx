"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, CheckCircle2, Home } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "../../../components/index/header"
import Footer from "../../../components/index/footer"
import PersonalityTest from "../../../components/testPerso/personality-test"

export default function TestPersonnalitePage({
  params,
}: {
  params: Promise<{ candidat: string; offre: string }>
}) {
  // Unwrap the params Promise using React.use()
  const { candidat, offre } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offreDetails, setOffreDetails] = useState<any>(null)
  const [testCompleted, setTestCompleted] = useState(false)

  // Parse IDs from params, ensuring they're valid numbers
  const candidatId = candidat ? Number.parseInt(candidat, 10) : null
  const offreId = offre ? Number.parseInt(offre, 10) : null

  useEffect(() => {
    // Validate IDs
    if (!candidatId || isNaN(candidatId) || !offreId || isNaN(offreId)) {
      setError("Identifiants de candidat ou d'offre invalides")
      setLoading(false)
      return
    }

    // Fetch job details
    const fetchOffreDetails = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/offreDetail/${offreId}`)
        if (!response.ok) {
          throw new Error(`Impossible de récupérer les détails de l'offre: ${response.status}`)
        }
        const data = await response.json()
        setOffreDetails(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de l'offre:", error)
        // Don't set error here, as the test can continue without job details
      } finally {
        setLoading(false)
      }
    }

    fetchOffreDetails()
  }, [candidatId, offreId, candidat, offre])

  const handleTestComplete = () => {
    setTestCompleted(true)
    // Redirect to jobs page after a delay
    setTimeout(() => {
      router.push("/jobs")
    }, 5000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb and title */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary transition-colors">
                <Home className="h-4 w-4 inline mr-1" />
                Accueil
              </Link>
              <span>/</span>
              <Link href="/jobs" className="hover:text-primary transition-colors">
                Offres d'emploi
              </Link>
              <span>/</span>
              {offreDetails ? (
                <Link href={`/jobsDetail/${offreId}`} className="hover:text-primary transition-colors">
                  {offreDetails.poste}
                </Link>
              ) : (
                <span>Détail de l'offre</span>
              )}
              <span>/</span>
              <span className="text-primary font-medium">Test de personnalité</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Test de personnalité</h1>
                <p className="text-muted-foreground mt-1">
                  {offreDetails
                    ? `Pour le poste de ${offreDetails.poste} chez ${offreDetails.societe}`
                    : "Évaluez votre compatibilité avec le poste"}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => router.back()} className="self-start">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>

          {/* Main content */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 md:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground mt-4">Chargement du test de personnalité...</p>
                </div>
              ) : error ? (
                <div className="py-8">
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <div className="flex justify-center mt-6">
                    <Button onClick={() => router.push("/jobs")}>Retour aux offres d'emploi</Button>
                  </div>
                </div>
              ) : testCompleted ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Test complété avec succès !</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Merci d'avoir complété le test de personnalité. Votre candidature a été enregistrée et sera examinée
                    par notre équipe.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => router.push("/jobs")}>Voir d'autres offres</Button>
                    <Button variant="outline" onClick={() => router.push("/")}>
                      Retour à l'accueil
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-8">
                    Vous serez redirigé automatiquement dans quelques secondes...
                  </p>
                </div>
              ) : (
                <div className="test-container">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Instructions</h2>
                    <p className="text-muted-foreground">
                      Ce test de personnalité nous aidera à évaluer votre compatibilité avec le poste. Veuillez répondre
                      honnêtement à toutes les questions. Il n'y a pas de bonnes ou mauvaises réponses.
                    </p>
                  </div>

                  {candidatId && offreId ? (
                    <PersonalityTest candidatId={candidatId} offreId={offreId} onTestComplete={handleTestComplete} />
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>Identifiants manquants pour le test</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

