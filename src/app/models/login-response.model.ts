// src/app/auth/models/login-response.model.ts
export interface LoginResponse {
  /** JWT de acceso */
  token: string;
  /** Indica si es primer ingreso */
  primerIngreso: boolean;
  /** Nombre completo del usuario */
  nombreCompleto: string;
  /** Rol asignado al usuario */
  rol: string;
  /** Nombre del estado o entidad del usuario */
  nombreEstado: string;
  /** Identificador único del usuario */
  userId: number;
  /** Refresh token opcional */
  refreshToken?: string;
}
