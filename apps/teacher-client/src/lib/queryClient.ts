/**
 * React Query Client Configuration
 * Provides centralized configuration for all queries and mutations
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute
      staleTime: 60000,
      // Cached data persists for 5 minutes
      gcTime: 300000,
      // Retry failed queries once
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
