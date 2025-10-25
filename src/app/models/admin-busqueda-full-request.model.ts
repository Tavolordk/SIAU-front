// src/app/models/admin-busqueda-full-request.model.ts
export interface AdminBusquedaFullRequest {
  cuenta_codigo: string | null;
  nombres: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  curp: string | null;
  rfc: string | null;

  folio: string | null;
  tipo_tramite: string | null;
  estatus: string | null;
  fecha_desde: string | null; // ISO YYYY-MM-DD o null
  fecha_hasta: string | null; // ISO YYYY-MM-DD o null

  tipo_institucion: string | null;
  entidad: string | null;
  municipio: string | null;
  institucion: string | null;
  dependencia: string | null;
  corporacion: string | null;
  area: string | null;

  busca: string | null;
  limit: number;
  offset: number;
}
