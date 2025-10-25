export interface AdminCedulaDetalleRequestById {
  id: number;
}

export interface AdminCedulaDetalleRequestByFolio {
  folio: string;
}

export type AdminCedulaDetalleRequest =
  | AdminCedulaDetalleRequestById
  | AdminCedulaDetalleRequestByFolio;

export interface AdminCedulaDetalleResponse {
  id: number;
  rfc: string | null;
  area: string | null;
  cuip: string | null;
  curp: string | null;
  sexo: string | null;
  cargo: string | null;
  folio: string | null;
  entidad: string | null;
  nombres: string | null;
  sistema: string | null;
  perfiles: any[];         // ← tipa si ya conoces la forma
  telefono: string | null;
  creado_en: string | null;       // "YYYY-MM-DD HH:mm:ss.ffffff"
  funciones: string | null;
  municipio: string | null;
  creado_por: number | null;
  documentos: any[];       // ← tipa si ya conoces la forma
  comentarios: any[];      // ← tipa si ya conoces la forma
  corporacion: string | null;
  dependencia: string | null;
  institucion: string | null;
  estado_civil: string | null;
  nacionalidad: string | null;
  tipo_tramite: string | null;
  tipo_usuario: string | null;
  cuenta_codigo: string | null;
  fecha_ingreso: string | null;   // "YYYY-MM-DD"
  hora_pantalla: string | null;   // "HH:mm:ss.ffffff"
  pais_comision: string | null;
  actualizado_en: string | null;  // "YYYY-MM-DD HH:mm:ss.ffffff"
  fecha_pantalla: string | null;  // "YYYY-MM-DD"
  tiene_telegram: number | null;  // 0 | 1
  fecha_solicitud: string | null; // "YYYY-MM-DD"
  numero_empleado: string | null;
  pais_nacimiento: string | null;
  primer_apellido: string | null;
  entidad_comision: string | null;
  esta_comisionado: number | null; // 0 | 1
  estado_solicitud: string | null;
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  segundo_apellido: string | null;
  tipo_institucion: string | null;
  correo_electronico: string | null;
  entidad_nacimiento: string | null;
  municipio_alcaldia: string | null;
  municipio_comision: string | null;
  personal_seguridad: number | null; // 0 | 1
  tipo_documento_sel: string | null;
  corporacion_comision: string | null;
  dependencia_comision: string | null;
  especificar_comision: string | null;
  institucion_comision: string | null;
  usuario_sistema_nombre: string | null;
  tipo_institucion_comision: string | null;
}
