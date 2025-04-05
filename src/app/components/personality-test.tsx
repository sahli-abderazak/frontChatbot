"use client"

import { Button } from "@/components/ui/button"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

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
  // const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (message: string) => {
    // setDebugInfo((prev) => [...prev, message])
    console.log(message)
  }

  useEffect(() => {
    fetchQuestions()
  }, [candidatId, offreId])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      // addDebugInfo(`Tentative de récupération des questions pour candidat ID: ${candidatId}, offre ID: ${offreId}`)

      // First try to get questions from Laravel backend
      try {
        // Assurez-vous que les IDs sont bien des nombres
        const candidatIdNumber = Number(candidatId)
        const offreIdNumber = Number(offreId)

        // addDebugInfo(`Envoi des IDs convertis: candidat_id=${candidatIdNumber}, offre_id=${offreIdNumber}`)

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
          // addDebugInfo(`Questions récupérées depuis Laravel: ${data.length} questions`)
          setQuestions(data)
          setLoading(false)
          return
        } else {
          const errorText = await response.text()
          // addDebugInfo(`Échec de récupération depuis Laravel: ${response.status}, message: ${errorText}`)
        }
      } catch (error) {
        // addDebugInfo(`Erreur lors de l'appel à Laravel: ${error.message}`)
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

      // Récupération du texte brut
      const data = await response.text()
      // addDebugInfo(`Réponse brute de l'API: ${data.substring(0, 100)}...`) // Log only first 100 chars to avoid overflow

      // Extraction et transformation des questions
      let questionsArray: TestQuestion[] = []

      try {
        // Essayer d'abord de parser directement comme un tableau JSON
        const parsedData = JSON.parse(data)

        if (Array.isArray(parsedData)) {
          // Si c'est déjà un tableau, l'utiliser directement
          questionsArray = parsedData
          // addDebugInfo(`Questions parsées avec succès comme tableau: ${questionsArray.length} questions`)
        } else {
          // Si ce n'est pas un tableau mais un objet JSON valide
          // Vérifier s'il contient des propriétés "question"
          if (parsedData.question && parsedData.options) {
            // C'est une seule question, la mettre dans un tableau
            questionsArray = [parsedData]
            // addDebugInfo(`Une seule question trouvée et mise dans un tableau`)
          } else {
            // Essayer d'extraire les questions du texte
            // addDebugInfo(`Tentative d'extraction des questions du texte JSON`)
            questionsArray = extractQuestionsFromText(data)
          }
        }
      } catch (e) {
        addDebugInfo(`Erreur de parsing JSON: ${e.message}`)
        // Si le parsing échoue, essayer d'extraire les questions du texte
        questionsArray = extractQuestionsFromText(data)
      }

      if (questionsArray.length === 0) {
        throw new Error("Aucune question n'a pu être extraite de la réponse")
      }

      addDebugInfo(`Nombre final de questions extraites: ${questionsArray.length}`)
      setQuestions(questionsArray)
    } catch (error) {
      // addDebugInfo(`Erreur: ${error.message}`)
      setError("Impossible de charger les questions du test. Veuillez réessayer.")

      // Utiliser des questions de secours en cas d'erreur
      setQuestions([
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
      ])
    } finally {
      setLoading(false)
    }
  }

  const extractQuestionsFromText = (text: string): TestQuestion[] => {
    try {
      // Supprimer les balises HTML et les caractères spéciaux
      const cleanText = text.replace(/<[^>]*>/g, "").replace(/&[^;]*;/g, "")

      // Diviser le texte en blocs potentiels de questions
      const questionBlocks = cleanText.split(/(?=\n*\d+\.\s)/)

      const extractedQuestions: TestQuestion[] = questionBlocks
        .map((block) => {
          // Extraire la question
          const questionMatch = block.match(/\d+\.\s(.*?)(?=\n*[a-d]\.\s)/s)
          const question = questionMatch ? questionMatch[1].trim() : null

          // Extraire les options
          const optionMatches = Array.from(block.matchAll(/([a-d])\.\s(.*?)(?=\n*[a-d]\.\s|$)/gs)).map((match) => ({
            letter: match[1],
            text: match[2].trim(),
          }))

          if (question && optionMatches.length === 4) {
            return {
              question: question,
              options: optionMatches.map((opt, index) => ({
                text: opt.text,
                score: index + 2, // Assign scores 2-5 based on position
              })),
            }
          } else {
            return null
          }
        })
        .filter((q): q is TestQuestion => q !== null)

      return extractedQuestions
    } catch (e) {
      console.error("Erreur lors de l'extraction des questions du texte", e)
      return []
    }
  }

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option)
  }

  const goToNextQuestion = () => {
    if (selectedOption) {
      setTotalScore(totalScore + selectedOption.score)
      setSelectedOption(null)

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        submitTest()
      }
    } else {
      setError("Veuillez sélectionner une réponse.")
    }
  }

  const submitTest = async () => {
    try {
      setSubmitting(true)
      // addDebugInfo(`Soumission du test avec score total: ${totalScore}`)

      // Ensure we have valid IDs
      if (!candidatId || !offreId) {
        throw new Error("Identifiants de candidat ou d'offre manquants")
      }

      // Plusieurs tentatives d'enregistrement du score
      let success = false
      let attempts = 0
      const maxAttempts = 3

      while (!success && attempts < maxAttempts) {
        attempts++
        addDebugInfo(`Tentative d'enregistrement du score #${attempts}`)

        try {
          // Assurez-vous que les IDs sont bien des nombres
          const candidatIdNumber = Number(candidatId)
          const offreIdNumber = Number(offreId)

          // addDebugInfo(
          //   `Envoi des IDs convertis pour le score: candidat_id=${candidatIdNumber}, offre_id=${offreIdNumber}`,
          // )

          // Tentative d'enregistrement via l'API Laravel
          const response = await fetch(`http://127.0.0.1:8000/api/store-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              candidat_id: candidatIdNumber,
              offre_id: offreIdNumber,
              score: totalScore,
            }),
          })

          // Vérifier si la réponse est OK
          if (response.ok) {
            const data = await response.json()
            // addDebugInfo(`Score enregistré avec succès: ${JSON.stringify(data)}`)
            success = true
            break
          } else {
            // Récupérer le message d'erreur
            let errorMessage = "Erreur inconnue"
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorData.message || `Erreur HTTP ${response.status}`
            } catch (e) {
              const errorText = await response.text()
              errorMessage = `Erreur HTTP ${response.status}: ${errorText}`
            }

            // addDebugInfo(`Échec de l'enregistrement: ${errorMessage}`)

            // Si c'est la dernière tentative, lancer une erreur
            if (attempts === maxAttempts) {
              throw new Error(errorMessage)
            }
          }
        } catch (apiError) {
          // addDebugInfo(`Exception lors de l'appel API: ${apiError.message}`)

          // Si c'est la dernière tentative, lancer une erreur
          if (attempts === maxAttempts) {
            throw apiError
          }
        }

        // Attendre avant la prochaine tentative
        if (!success && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      // Si toutes les tentatives ont échoué mais qu'on veut quand même permettre à l'utilisateur de terminer
      if (!success) {
        // addDebugInfo("Toutes les tentatives ont échoué, mais on permet à l'utilisateur de terminer")
        success = true
      }

      // Finaliser le test
      if (success) {
        // addDebugInfo("Test complété avec succès")
        setTestCompleted(true)

        // Attendre un peu avant de fermer le test
        setTimeout(() => {
          if (onTestComplete) {
            onTestComplete()
          }
        }, 3000)
      }
    } catch (error) {
      // addDebugInfo(`Erreur finale: ${error.message}`)
      setError(`Erreur lors de l'enregistrement du score: ${error.message}`)

      // Même en cas d'erreur, permettre à l'utilisateur de terminer le test
      setTimeout(() => {
        // addDebugInfo("Permettre à l'utilisateur de terminer malgré l'erreur")
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </h3>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border">
        <h4 className="text-xl font-medium mb-6">{currentQuestion.question}</h4>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded-md cursor-pointer transition-all ${
                selectedOption === option
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => !selectedOption && handleOptionSelect(option)}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedOption === option ? "border-primary" : "border-gray-400"
                  }`}
                >
                  {selectedOption === option && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
                <span>{option.text}</span>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

        <div className="mt-8 flex justify-end">
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

      {/* Debug Information - Only show in development */}
      {/* {process.env.NODE_ENV === "development" && debugInfo.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h4 className="text-sm font-medium mb-2">Informations de débogage:</h4>
          <div className="max-h-[200px] overflow-y-auto">
            <ul className="text-xs font-mono space-y-1">
              {debugInfo.map((message, index) => (
                <li key={index} className="border-b border-gray-200 pb-1">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )} */}
    </div>
  )
}

export default PersonalityTest

