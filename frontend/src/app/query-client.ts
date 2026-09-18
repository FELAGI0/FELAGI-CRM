import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && [401, 403, 404, 422].includes(error.response?.status ?? 0)) return false
        return failureCount < 2
      },
    },
  },
})
