export type EstatusCedula = 'Enviada' | 'Validada' | 'Rechazada';

export interface CedulaAgregarComentarioRequest {
  folio: string;
  autor_nombre: string;  // p. ej. "María Gómez"
  rol: string;           // p. ej. "ADMINISTRADOR"
  cuenta_autor: string;  // p. ej. "U999999"
  texto: string;
  nuevo_estatus: EstatusCedula | null;
}
