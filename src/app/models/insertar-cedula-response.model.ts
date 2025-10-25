export interface InsertarCedulaResponse {
  success: number;                // 1 = OK
  inserted_id: number;            // 7
  folio: string;                  // "PM-2025-10-6"
  message: string | null;
}
