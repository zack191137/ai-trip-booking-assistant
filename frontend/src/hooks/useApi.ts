import { useState, useEffect, useCallback } from 'react'
import { ErrorHandler } from '@/utils/errorHandler'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
  deps?: React.DependencyList
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true, deps = [] } = options
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await apiFunction()
      setState({
        data: result,
        loading: false,
        error: null,
      })
      return result
    } catch (error) {
      const errorMessage = ErrorHandler.getErrorMessage(error)
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps])

  return {
    ...state,
    execute,
    reset,
    clearError,
  }
}

export function useMutation<T, P = unknown>(
  mutationFunction: (params: P) => Promise<T>
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await mutationFunction(params)
      setState({
        data: result,
        loading: false,
        error: null,
      })
      return result
    } catch (error) {
      const errorMessage = ErrorHandler.getErrorMessage(error)
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [mutationFunction])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    mutate,
    reset,
    clearError,
  }
}

export default useApi