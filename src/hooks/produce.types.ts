export type GenerationJobStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';

export type MissingProducePrerequisite = 'asset' | 'config' | 'dataSource' | 'canvasElements';

export type TriggerProduceResponse = {
  jobId: string;
  boardId: string;
  status: 'QUEUED';
  progress: number;
  totalRecords: number;
  createdAt: string;
};

export type ProduceStatusResponse = {
  jobId: string;
  boardId: string;
  status: GenerationJobStatus;
  progress: number;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  downloadUrl?: string;
  errorMessage?: string;
};

export type ProduceApiError = {
  error: string;
  errorCode?: 'INSUFFICIENT_CREDITS' | 'HIGH_VOLUME_CREDITS_REQUIRED' | 'ROW_LIMIT_EXCEEDED';
  missing?: MissingProducePrerequisite[];
  jobId?: string;
  allowedRows?: number;
  requestedRows?: number;
};
