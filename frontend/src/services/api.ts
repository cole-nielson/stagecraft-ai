import axios from 'axios';
import { Style, Staging, HealthStatus, StagingRequest, BatchStaging, BatchStagingRequest } from '../types';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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

  // Upload and stage multiple rooms
  stageBatch: async (request: BatchStagingRequest): Promise<BatchStaging> => {
    const formData = new FormData();
    
    // Add all images
    request.images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    // Add room types if provided
    if (request.room_types) {
      request.room_types.forEach((roomType, index) => {
        formData.append('room_types', roomType);
      });
    }
    
    if (request.quality_mode) {
      formData.append('quality_mode', request.quality_mode);
    }

    const response = await api.post('/api/stage-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get batch status and results
  getBatchStatus: async (batchId: string): Promise<BatchStaging> => {
    const response = await api.get(`/api/batch/${batchId}`);
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

export default api;