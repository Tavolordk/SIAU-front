export interface AsignacionCreateDto {
  id?: number;
  tipoAsignacion: string;
  estructuraId: number;
  fechaInicio: string;  // ISO date
}
