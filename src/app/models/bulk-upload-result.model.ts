// File: src/app/usuarios/models/bulk-upload-result.model.ts

export interface BulkUploadResult {
  fila: number;
  estado: 'ok' | 'error' | 'warning';
  mensaje?: string;
  usuarioId?: number;
}
