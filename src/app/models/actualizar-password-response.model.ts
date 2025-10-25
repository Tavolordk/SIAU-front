export interface ActualizarPasswordResponse {
  success: number;                // 1 = OK
  code: string | null;
  message: string | null;         // "OK"
  updated_rows: number | null;
  user_id: number | null;
}
