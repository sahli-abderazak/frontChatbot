"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ImageAnalysisTest from "./image-analysis-test"

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
  const [testStage, setTestStage] = useState<"qcm" | "image" | "completed">("qcm")
  const [personalityAnalysis, setPersonalityAnalysis] = useState<string | null>(null)

  // Use refs to track initialization state
  const isInitialRender = useRef(true)
  const questionsInitialized = useRef(false)

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions()
  }, [candidatId, offreId])

  // Initialize answers array when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !questionsInitialized.current) {
      console.log("Initializing answers array for the first time")
      setAnswers(new Array(questions.length).fill(null))
      questionsInitialized.current = true
    }
  }, [questions])

  // Update selected option when changing questions
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length && !isInitialRender.current) {
      console.log(`Updating selected option for question ${currentQuestionIndex}`)
      setSelectedOption(answers[currentQuestionIndex])
    }

    // Mark initial render as complete after the first run
    if (isInitialRender.current) {
      isInitialRender.current = false
    }
  }, [currentQuestionIndex, answers, questions])

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

          if (Array.isArray(data) && data.length > 0) {
            // Set questions and reset state in a controlled way
            setQuestions(data)
            // Don't set currentQuestionIndex here, let the initialization effect handle it
            setLoading(false)
            return
          } else {
            console.log("Réponse valide mais format incorrect ou vide, essai avec FastAPI")
          }
        } else {
          const errorText = await response.text()
          console.log(`Échec de récupération depuis Laravel: ${response.status}, message: ${errorText}`)
        }
      } catch (error) {
        console.error(`Erreur lors de l'appel à Laravel: ${error instanceof Error ? error.message : String(error)}`)
        // Continue to FastAPI as fallback
      }

      // Fallback to FastAPI
      try {
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
          if (Array.isArray(data) && data.length > 0) {
            parsedQuestions = data
          } else if (data.question && Array.isArray(data.options)) {
            // Single question object
            parsedQuestions = [data]
          }

          if (parsedQuestions.length > 0) {
            // Set questions and reset state in a controlled way
            setQuestions(parsedQuestions)
            // Don't set currentQuestionIndex here, let the initialization effect handle it
            setLoading(false)
            return
          }
        } catch (e) {
          console.error("Erreur de parsing JSON:", e)
        }
      } catch (error) {
        console.error(`Erreur avec FastAPI: ${error instanceof Error ? error.message : String(error)}`)
      }

      // If both API calls fail, show error
      setError("Impossible de récupérer les questions du test. Veuillez réessayer plus tard.")
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError("Impossible de charger les questions du test. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
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
      submitQcmTest(finalScore)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setError(null)
    }
  }

  const submitQcmTest = async (finalScore: number) => {
    try {
      setSubmitting(true)
      console.log(`Soumission du test QCM avec score total: ${finalScore}`)

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

      // Move to the image analysis stage
      setTestStage("image")
    } catch (error) {
      console.error(`Erreur finale: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Erreur lors de l'enregistrement du score: ${error instanceof Error ? error.message : String(error)}`)

      // Even if there's an error, move to the image analysis stage
      setTimeout(() => {
        setTestStage("image")
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageAnalysisComplete = (analysis: string) => {
    setPersonalityAnalysis(analysis)
    setTestStage("completed")
    setTestCompleted(true)

    // Wait a bit before calling the onTestComplete callback
    setTimeout(() => {
      if (onTestComplete) {
        onTestComplete()
      }
    }, 3000)
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

  if (loading && testStage === "qcm") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Chargement des questions...</p>
      </div>
    )
  }

  if (testStage === "completed") {
    return (
      <div className="success-container">
        <div className="success-icon-container">
          <CheckCircle2 className="success-icon" />
        </div>
        <h3 className="success-title">Test terminé avec succès !</h3>
        <p className="success-message">Votre candidature a été enregistrée avec succès.</p>
        {personalityAnalysis && (
          <div className="bg-[#ecfdf5] p-4 rounded-lg border border-[#a7f3d0] mb-4 max-w-2xl text-left">
            <h4 className="font-medium text-[#065f46] mb-2">Analyse de personnalité</h4>
            <p className="text-[#047857]">{personalityAnalysis}</p>
          </div>
        )}
      </div>
    )
  }

  if (testStage === "image") {
    return (
      <div className="test-content">
        <div className="test-instructions">
          <h3 className="instructions-title">Deuxième partie : Analyse d'image</h3>
          <p className="instructions-text">
            Dans cette partie du test, vous allez analyser une image qui représente une situation professionnelle. Votre
            description nous aidera à mieux comprendre votre personnalité et votre approche du travail.
          </p>
        </div>
        <ImageAnalysisTest candidatId={candidatId} offreId={offreId} onComplete={handleImageAnalysisComplete} />
      </div>
    )
  }

  if (error && testStage === "qcm") {
    return (
      <div className="error-container">
        <Alert variant="destructive" className="error-alert">
          <AlertCircle className="error-icon" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="error-action">
          <Button onClick={fetchQuestions} className="retry-button">
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="back-button">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  if (!questions.length && testStage === "qcm") {
    return (
      <div className="warning-container">
        <Alert variant="warning" className="warning-alert">
          <AlertCircle className="warning-icon" />
          <AlertDescription>Aucune question n'a été trouvée pour ce test.</AlertDescription>
        </Alert>
        <div className="warning-action">
          <Button onClick={fetchQuestions} className="retry-button">
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="back-button">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="test-content">
      {/* Progress bar with improved visual feedback */}
      <div className="progress-container">
        <div className="progress-header">
          <h3 className="progress-title">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </h3>
          <span className="progress-percentage">{Math.round(progress)}% complété</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question card with improved styling */}
      <div className="question-card">
        <h4 className="question-text">{currentQuestion.question}</h4>

        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`option-item ${selectedOption === option ? "selected" : ""}`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="option-content">
                <div className="option-radio">
                  {selectedOption === option && <div className="option-radio-inner"></div>}
                </div>
                <span className="option-text">{option.text}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="error-message">
            <AlertCircle className="error-icon-small" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation buttons with improved layout */}
        <div className="navigation-buttons">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            className="prev-button"
          >
            Question précédente
          </Button>

          <Button onClick={goToNextQuestion} disabled={!selectedOption || submitting} className="next-button">
            {submitting ? (
              <>
                <span className="loading-spinner-small"></span>
                Traitement...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              "Passer à l'analyse d'image"
            ) : (
              "Question suivante"
            )}
          </Button>
        </div>
      </div>

      {/* Question counter pills */}
      <div className="question-pills">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`question-pill ${
              index === currentQuestionIndex ? "current" : answers[index] ? "answered" : "unanswered"
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

