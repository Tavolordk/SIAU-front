export interface PersonaCreateDto {
  id?: number;                // cuando regresa del backend
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  rfc?: string;
  curp?: string;
  sexo?: string;
  fechaNacimiento?: string;   // ISO date string (YYYY-MM-DD)
}
