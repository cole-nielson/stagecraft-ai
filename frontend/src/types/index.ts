export interface Style {
  id: string;
  name: string;
  description: string;
  preview_image?: string;
  active: boolean;
  sort_order: number;
}

export interface Staging {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  original_image_url: string;
  staged_image_url?: string;
  style: string;
  room_type?: string;
  quality_mode: string;
  processing_time_ms?: number;
  quality_score?: number;
  architectural_integrity?: boolean;
  created_at: string;
  completed_at?: string;
  error?: string;
  task_id?: string;
  estimated_time_seconds?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: string;
    ai_service: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface StagingRequest {
  image: File;
  room_type?: string;
  quality_mode?: string;
}

export interface UploadProgress {
  progress: number;
  stage: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  usage_limit?: number;
  current_usage?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  staging_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectWithStagings extends Project {
  stagings: Staging[];
}