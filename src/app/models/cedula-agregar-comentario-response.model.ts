export interface CedulaComentarioItem {
  rol: string;
  autor: string;
  fecha: string; // "YYYY-MM-DD HH:mm:ss"
  texto: string;
  cuenta: string;
}

export interface CedulaAgregarComentarioResponse {
  estado_final: string | null;
  comentarios: CedulaComentarioItem[];
}
