export interface CorreoCodigoRequest {
  TipoTramite: 'codigo';
  Titulo: 'Código de Verificación';
  Subtitulo: 'Activación de cuenta';
  Codigo: string;
  NombreUsuario: string;
  DescripcionProposito: 'activar tu cuenta en el sistema';
  Destinatario: string; // email
}

export interface CorreoCodigoResponse {
  // Ajusta si tu backend devuelve algo distinto
  success?: number;
  message?: string | null;
  estado?: string | null;
  [k: string]: any;
}
