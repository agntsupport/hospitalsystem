export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];

  // Campos adicionales para compatibilidad con respuestas paginadas
  items?: T extends any[] ? T : never;
  pagination?: PaginationInfo;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  total?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  status?: number;
}