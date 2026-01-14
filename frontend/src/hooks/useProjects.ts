import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/api';
import { Project, ProjectWithStagings, Staging } from '../types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  unsorted: () => [...projectKeys.all, 'unsorted'] as const,
  history: () => [...projectKeys.all, 'history'] as const,
};

// Hook to fetch all projects
export function useProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const response = await projectsApi.getProjects();
      return response.projects;
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch a single project with its stagings
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      return projectsApi.getProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

// Hook to fetch unsorted stagings (not in any project)
export function useUnsortedStagings(enabled: boolean = true) {
  return useQuery({
    queryKey: projectKeys.unsorted(),
    queryFn: async () => {
      const response = await projectsApi.getUnsortedStagings();
      return response.stagings;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

// Hook to fetch staging history
export function useStagingHistory(enabled: boolean = true, limit?: number) {
  return useQuery({
    queryKey: projectKeys.history(),
    queryFn: async () => {
      const response = await projectsApi.getStagingHistory(limit);
      return response.stagings;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

// Hook to create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return projectsApi.createProject(name, description);
    },
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Hook to update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: { name?: string; description?: string } }) => {
      return projectsApi.updateProject(projectId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
  });
}

// Hook to delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      return projectsApi.deleteProject(projectId);
    },
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
