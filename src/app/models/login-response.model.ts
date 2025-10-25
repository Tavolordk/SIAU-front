export interface LoginResponse {
  success: number;                // 1 = OK
  user_id: number | null;
  fk_cat_tp_usuarios: number | null;
  code: string | null;
  message: string | null;
}
