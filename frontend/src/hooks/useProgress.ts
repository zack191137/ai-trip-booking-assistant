import { useState, useCallback } from 'react'

interface ProgressStep {
  id: string
  label: string
  description?: string
  completed?: boolean
  active?: boolean
  error?: boolean
}

interface UseProgressOptions {
  initialStep?: number
  steps: ProgressStep[]
}

export function useProgress({ initialStep = 0, steps }: UseProgressOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(
    steps.map((step, index) => ({
      ...step,
      active: index === initialStep,
      completed: index < initialStep,
    }))
  )

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, steps.length - 1)
      setProgressSteps(steps.map((step, index) => ({
        ...step,
        active: index === next,
        completed: index < next,
        error: false,
      })))
      return next
    })
  }, [steps])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const previous = Math.max(prev - 1, 0)
      setProgressSteps(steps.map((step, index) => ({
        ...step,
        active: index === previous,
        completed: index < previous,
        error: false,
      })))
      return previous
    })
  }, [steps])

  const goToStep = useCallback((stepIndex: number) => {
    const targetStep = Math.max(0, Math.min(stepIndex, steps.length - 1))
    setCurrentStep(targetStep)
    setProgressSteps(steps.map((step, index) => ({
      ...step,
      active: index === targetStep,
      completed: index < targetStep,
      error: false,
    })))
  }, [steps])

  const markStepCompleted = useCallback((stepIndex: number) => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed: true, error: false } : step
    ))
  }, [])

  const markStepError = useCallback((stepIndex: number) => {
    setProgressSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, error: true, completed: false } : step
    ))
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(initialStep)
    setProgressSteps(steps.map((step, index) => ({
      ...step,
      active: index === initialStep,
      completed: index < initialStep,
      error: false,
    })))
  }, [initialStep, steps])

  const getProgress = useCallback(() => {
    const completedSteps = progressSteps.filter(step => step.completed).length
    return (completedSteps / steps.length) * 100
  }, [progressSteps, steps.length])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const canGoNext = currentStep < steps.length - 1
  const canGoPrev = currentStep > 0

  return {
    currentStep,
    progressSteps,
    nextStep,
    prevStep,
    goToStep,
    markStepCompleted,
    markStepError,
    reset,
    getProgress,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    totalSteps: steps.length,
  }
}

export default useProgress