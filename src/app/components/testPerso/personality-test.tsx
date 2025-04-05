"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Option {
  text: string
  score: number
}

interface TestQuestion {
  question: string
  options: Option[]
}

interface PersonalityTestProps {
  candidatId: number
  offreId: number
  onTestComplete?: () => void
}

const PersonalityTest: React.FC<PersonalityTestProps> = ({ candidatId, offreId, onTestComplete }) => {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testCompleted, setTestCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<(Option | null)[]>([])

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions()
  }, [candidatId, offreId])

  // Initialize answers array when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(null))
    }
  }, [questions])

  // Update selected option when changing questions
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setSelectedOption(answers[currentQuestionIndex])
    }
  }, [currentQuestionIndex, answers])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Récupération des questions pour candidat ID: ${candidatId}, offre ID: ${offreId}`)

      // First try to get questions from Laravel backend
      try {
        // Ensure IDs are numbers
        const candidatIdNumber = Number(candidatId)
        const offreIdNumber = Number(offreId)

        if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
          throw new Error("IDs de candidat ou d'offre invalides")
        }

        const response = await fetch(`http://127.0.0.1:8000/api/generate-test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidat_id: candidatIdNumber,
            offre_id: offreIdNumber,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`Questions récupérées depuis Laravel: ${data.length} questions`)
          setQuestions(data)
          setLoading(false)
          return
        } else {
          const errorText = await response.text()
          console.log(`Échec de récupération depuis Laravel: ${response.status}, message: ${errorText}`)
        }
      } catch (error) {
        console.error(`Erreur lors de l'appel à Laravel: ${error instanceof Error ? error.message : String(error)}`)
        // Continue to FastAPI as fallback
      }

      // Fallback to FastAPI
      const response = await fetch(`http://127.0.0.1:8001/generate-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: "Développeur expérimenté avec 5 ans d'expérience en développement web. Compétences en JavaScript, TypeScript, React, Node.js et bases de données SQL et NoSQL. Diplômé d'un Master en Informatique.",
          offre:
            "Poste de développeur backend. Responsabilités: développement et maintenance des applications web, optimisation des performances, collaboration avec l'équipe frontend.",
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des questions: ${response.status}`)
      }

      // Parse the response
      const responseText = await response.text()
      let parsedQuestions: TestQuestion[] = []

      try {
        // Try to parse as JSON
        const data = JSON.parse(responseText)
        if (Array.isArray(data)) {
          parsedQuestions = data
        } else if (data.question && Array.isArray(data.options)) {
          // Single question object
          parsedQuestions = [data]
        }
      } catch (e) {
        console.error("Erreur de parsing JSON:", e)
        // Use fallback questions
        parsedQuestions = getFallbackQuestions()
      }

      if (parsedQuestions.length === 0) {
        parsedQuestions = getFallbackQuestions()
      }

      setQuestions(parsedQuestions)
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError("Impossible de charger les questions du test. Veuillez réessayer.")
      setQuestions(getFallbackQuestions())
    } finally {
      setLoading(false)
    }
  }

  const getFallbackQuestions = (): TestQuestion[] => {
    return [
      {
        question: "Comment réagissez-vous face à un problème complexe au travail?",
        options: [
          { text: "Je demande immédiatement de l'aide à mes collègues", score: 2 },
          { text: "J'essaie de le résoudre seul(e) avant de demander de l'aide", score: 4 },
          { text: "Je décompose le problème en parties plus petites et gérables", score: 5 },
          { text: "Je reporte le problème à mon supérieur", score: 1 },
        ],
      },
      {
        question: "Comment gérez-vous les délais serrés?",
        options: [
          { text: "Je travaille plus d'heures pour terminer à temps", score: 3 },
          { text: "Je priorise les tâches et me concentre sur les plus importantes", score: 5 },
          { text: "Je demande une extension de délai", score: 1 },
          { text: "Je délègue certaines tâches à mes collègues", score: 4 },
        ],
      },
      {
        question: "Comment préférez-vous travailler?",
        options: [
          { text: "Seul(e), en autonomie complète", score: 3 },
          { text: "En équipe, avec des interactions régulières", score: 4 },
          { text: "Un mélange des deux, selon les tâches", score: 5 },
          { text: "Sous supervision directe", score: 2 },
        ],
      },
    ]
  }

  const handleOptionSelect = (option: Option) => {
    // Store the answer in the answers array
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = option
    setAnswers(newAnswers)

    // Update selected option for display
    setSelectedOption(option)
    setError(null)
  }

  const goToNextQuestion = () => {
    if (!selectedOption) {
      setError("Veuillez sélectionner une réponse.")
      return
    }

    // Store the current answer
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = selectedOption
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate final score from all answers
      const finalScore = newAnswers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)
      setTotalScore(finalScore)
      submitTest(finalScore)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setError(null)
    }
  }

  const submitTest = async (finalScore: number) => {
    try {
      setSubmitting(true)
      console.log(`Soumission du test avec score total: ${finalScore}`)

      // Ensure we have valid IDs and convert them to numbers
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(
        `Envoi du score pour candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}, score: ${finalScore}`,
      )

      // Try to submit the score to the backend
      let success = false
      let attempts = 0
      const maxAttempts = 3

      while (!success && attempts < maxAttempts) {
        attempts++
        console.log(`Tentative d'enregistrement du score #${attempts}`)

        try {
          const response = await fetch(`http://127.0.0.1:8000/api/store-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              candidat_id: candidatIdNumber,
              offre_id: offreIdNumber,
              score: finalScore,
            }),
          })

          // Log the raw response for debugging
          const responseText = await response.text()
          console.log(`Response raw text: ${responseText}`)

          // Try to parse the response as JSON
          let data
          try {
            data = JSON.parse(responseText)
          } catch (e) {
            console.error(`Failed to parse response as JSON: ${e}`)
            data = { error: "Invalid JSON response" }
          }

          if (response.ok) {
            console.log(`Score enregistré avec succès: ${JSON.stringify(data)}`)
            success = true
            break
          } else {
            const errorMessage = data.error || data.message || `Erreur HTTP ${response.status}`
            console.error(`Échec de l'enregistrement: ${errorMessage}`)

            if (attempts === maxAttempts) {
              throw new Error(errorMessage)
            }
          }
        } catch (apiError) {
          console.error(
            `Exception lors de l'appel API: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
          )

          if (attempts === maxAttempts) {
            throw apiError
          }
        }

        // Wait before next attempt
        if (!success && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      // Finaliser le test même si l'enregistrement a échoué
      console.log("Test complété" + (success ? " avec succès" : " mais l'enregistrement a échoué"))
      setTestCompleted(true)

      // Attendre un peu avant de fermer le test
      setTimeout(() => {
        if (onTestComplete) {
          onTestComplete()
        }
      }, 3000)
    } catch (error) {
      console.error(`Erreur finale: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Erreur lors de l'enregistrement du score: ${error instanceof Error ? error.message : String(error)}`)

      // Même en cas d'erreur, permettre à l'utilisateur de terminer le test
      setTimeout(() => {
        console.log("Permettre à l'utilisateur de terminer malgré l'erreur")
        setTestCompleted(true)

        setTimeout(() => {
          if (onTestComplete) {
            onTestComplete()
          }
        }, 3000)
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  // Navigation directe vers une question spécifique
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Sauvegarder la réponse actuelle avant de naviguer
      if (selectedOption) {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = selectedOption
        setAnswers(newAnswers)
      }

      setCurrentQuestionIndex(index)
      setError(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Chargement des questions...</p>
      </div>
    )
  }

  if (testCompleted) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Test terminé avec succès !</h3>
        <p className="text-muted-foreground mb-4">Votre score est de {totalScore} points.</p>
      </div>
    )
  }

  if (error && !questions.length) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <p className="text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </p>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
        <p className="text-amber-700">Aucune question n'a été trouvée pour ce test.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-8">
      {/* Progress bar with improved visual feedback */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </h3>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question card with improved styling */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h4 className="text-xl font-medium mb-6">{currentQuestion.question}</h4>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded-md cursor-pointer transition-all duration-200 ${
                selectedOption === option
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedOption === option ? "border-primary" : "border-gray-400"
                  }`}
                >
                  {selectedOption === option && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
                <span className={selectedOption === option ? "font-medium" : ""}>{option.text}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation buttons with improved layout */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            className="min-w-[120px]"
          >
            Question précédente
          </Button>

          <Button onClick={goToNextQuestion} disabled={!selectedOption || submitting} className="min-w-[150px]">
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Traitement...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              "Terminer le test"
            ) : (
              "Question suivante"
            )}
          </Button>
        </div>
      </div>

      {/* Question counter pills */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors ${
              index === currentQuestionIndex
                ? "bg-primary text-white"
                : answers[index]
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => navigateToQuestion(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PersonalityTest

