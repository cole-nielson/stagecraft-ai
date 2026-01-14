import axios from 'axios';
import { Style, Staging, HealthStatus, StagingRequest, Project, ProjectWithStagings, User } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors - clear token if invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Optionally trigger a re-auth (can emit an event here)
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const stagingApi = {
  // Upload and stage a room
  stageRoom: async (request: StagingRequest): Promise<Staging> => {
    const formData = new FormData();
    formData.append('image', request.image);
    if (request.room_type) {
      formData.append('room_type', request.room_type);
    }
    if (request.quality_mode) {
      formData.append('quality_mode', request.quality_mode);
    }

    const response = await api.post('/api/stage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get staging status and results
  getStagingStatus: async (stagingId: string): Promise<Staging> => {
    const response = await api.get(`/api/stage/${stagingId}`);
    return response.data;
  },

  // Get available styles
  getStyles: async (): Promise<Style[]> => {
    const response = await api.get('/api/styles');
    return response.data.styles;
  },

  // Health check
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Get image URL
  getImageUrl: (filename: string): string => {
    if (!filename) return '';
    // Handle both full URLs and filenames
    if (filename.startsWith('http')) return filename;
    return `${API_BASE_URL}/api/images/${filename}`;
  },

  // Build absolute image URL from relative API response
  buildImageUrl: (relativeUrl: string): string => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Remove leading slash if present to avoid double slash
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
    return `${API_BASE_URL}/${cleanUrl}`;
  },
};

// Utility function to extract filename from path
export const getFilenameFromPath = (path: string): string => {
  if (!path) return '';
  return path.split('/').pop() || '';
};

// Auth API
export const authApi = {
  // Register a new user
  register: async (email: string, password: string, name: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  // Login with email and password
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Get current user info
  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (client-side)
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get Google OAuth URL
  getGoogleAuthUrl: (): string => {
    return `${API_BASE_URL}/auth/google`;
  },
};

// Projects API
export const projectsApi = {
  // List all projects for current user
  getProjects: async (): Promise<{ projects: Project[] }> => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  // Create a new project
  createProject: async (name: string, description?: string): Promise<Project> => {
    const response = await api.post('/api/projects', { name, description });
    return response.data;
  },

  // Get a specific project with its stagings
  getProject: async (projectId: string): Promise<ProjectWithStagings> => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  },

  // Update a project
  updateProject: async (projectId: string, data: { name?: string; description?: string }): Promise<Project> => {
    const response = await api.put(`/api/projects/${projectId}`, data);
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}`);
  },

  // Get staging history
  getStagingHistory: async (limit?: number): Promise<{ stagings: Staging[] }> => {
    const response = await api.get('/api/stagings/history', { params: { limit } });
    return response.data;
  },

  // Get unsorted stagings (not in any project)
  getUnsortedStagings: async (limit?: number): Promise<{ stagings: Staging[] }> => {
    const response = await api.get('/api/stagings/unsorted', { params: { limit } });
    return response.data;
  },
};

export default api;