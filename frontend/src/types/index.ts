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
    redis: string;
    celery: string;
    ai_service: string;
  };
  worker_count?: number;
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

export interface BatchStagingRequest {
  images: File[];
  room_types?: string[];
  quality_mode?: string;
}

export interface BatchStaging {
  batch_id: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  total: number;
  completed: number;
  failed: number;
  processing: number;
  stagings: Staging[];
  total_images?: number;
  group_task_id?: string;
  estimated_time_seconds?: number;
}