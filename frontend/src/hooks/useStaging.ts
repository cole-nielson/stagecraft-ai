import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { stagingApi } from '../services/api';
import { Staging, StagingRequest, BatchStaging, BatchStagingRequest } from '../types';

export const useStaging = () => {
  const [stagingId, setStagingId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  // Mutation for staging a room
  const stagingMutation = useMutation({
    mutationFn: (request: StagingRequest) => stagingApi.stageRoom(request),
    onSuccess: (data: Staging) => {
      setStagingId(data.id);
      setBatchId(null); // Clear batch when doing single staging
    },
    onError: (error) => {
      console.error('Staging error:', error);
    },
  });

  // Mutation for batch staging
  const batchStagingMutation = useMutation({
    mutationFn: (request: BatchStagingRequest) => stagingApi.stageBatch(request),
    onSuccess: (data: BatchStaging) => {
      setBatchId(data.batch_id);
      setStagingId(null); // Clear single staging when doing batch
    },
    onError: (error) => {
      console.error('Batch staging error:', error);
    },
  });

  // Query for staging status (only when we have a staging ID)
  const stagingStatusQuery = useQuery({
    queryKey: ['staging-status', stagingId],
    queryFn: () => stagingId ? stagingApi.getStagingStatus(stagingId) : Promise.resolve(null),
    enabled: !!stagingId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
    retry: 3,
  });

  // Query for batch status (only when we have a batch ID)
  const batchStatusQuery = useQuery({
    queryKey: ['batch-status', batchId],
    queryFn: () => batchId ? stagingApi.getBatchStatus(batchId) : Promise.resolve(null),
    enabled: !!batchId,
    refetchInterval: (data) => {
      // Stop polling when completed, failed, or partial (all processing done)
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      // Continue polling while processing
      return 2000;
    },
    retry: 3,
  });

  // Start staging process
  const startStaging = useCallback(async (request: StagingRequest) => {
    setStagingId(null); // Reset previous staging
    setBatchId(null); // Reset previous batch
    return stagingMutation.mutateAsync(request);
  }, [stagingMutation]);

  // Start batch staging process
  const startBatchStaging = useCallback(async (request: BatchStagingRequest) => {
    setStagingId(null); // Reset previous staging
    setBatchId(null); // Reset previous batch
    return batchStagingMutation.mutateAsync(request);
  }, [batchStagingMutation]);

  // Reset staging state
  const resetStaging = useCallback(() => {
    setStagingId(null);
    setBatchId(null);
    stagingMutation.reset();
    batchStagingMutation.reset();
  }, [stagingMutation, batchStagingMutation]);

  return {
    // Single staging state
    stagingId,
    staging: stagingStatusQuery.data,
    isStaging: stagingMutation.isPending || (stagingStatusQuery.data?.status === 'processing'),
    isCompleted: stagingStatusQuery.data?.status === 'completed',
    isFailed: stagingStatusQuery.data?.status === 'failed',
    
    // Batch staging state
    batchId,
    batchStaging: batchStatusQuery.data,
    isBatchStaging: batchStagingMutation.isPending || (batchStatusQuery.data?.processing > 0),
    isBatchCompleted: batchStatusQuery.data?.status === 'completed',
    isBatchFailed: batchStatusQuery.data?.status === 'failed',
    isBatchPartial: batchStatusQuery.data?.status === 'partial',
    
    // Actions
    startStaging,
    startBatchStaging,
    resetStaging,
    
    // Loading states
    isLoading: stagingMutation.isPending || batchStagingMutation.isPending,
    isPolling: stagingStatusQuery.isFetching || batchStatusQuery.isFetching,
    
    // Errors
    error: stagingMutation.error || batchStagingMutation.error || stagingStatusQuery.error || batchStatusQuery.error,
  };
};