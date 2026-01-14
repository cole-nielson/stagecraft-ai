import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { stagingApi } from '../services/api';
import { Staging, StagingRequest } from '../types';

export const useStaging = () => {
  const [stagingId, setStagingId] = useState<string | null>(null);

  // Mutation for staging a room
  const stagingMutation = useMutation({
    mutationFn: (request: StagingRequest) => stagingApi.stageRoom(request),
    onSuccess: (data: Staging) => {
      setStagingId(data.id);
    },
    onError: (error) => {
      console.error('Staging error:', error);
    },
  });

  // Query for staging status (only when we have a staging ID)
  const stagingStatusQuery = useQuery({
    queryKey: ['staging-status', stagingId],
    queryFn: () => stagingId ? stagingApi.getStagingStatus(stagingId) : Promise.resolve(null),
    enabled: !!stagingId,
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const data = query.state.data;
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
    retry: 3,
  });

  // Start staging process
  const startStaging = useCallback(async (request: StagingRequest) => {
    setStagingId(null); // Reset previous staging
    return stagingMutation.mutateAsync(request);
  }, [stagingMutation]);

  // Reset staging state
  const resetStaging = useCallback(() => {
    setStagingId(null);
    stagingMutation.reset();
  }, [stagingMutation]);

  return {
    // Staging state
    stagingId,
    staging: stagingStatusQuery.data,
    isStaging: stagingMutation.isPending || (stagingStatusQuery.data?.status === 'processing'),
    isCompleted: stagingStatusQuery.data?.status === 'completed',
    isFailed: stagingStatusQuery.data?.status === 'failed',
    
    // Actions
    startStaging,
    resetStaging,
    
    // Loading states
    isLoading: stagingMutation.isPending,
    isPolling: stagingStatusQuery.isFetching,
    
    // Errors
    error: stagingMutation.error || stagingStatusQuery.error,
  };
};
