export interface PerfilItem {
  id: number;
  nombre: string;
}

export interface DocumentoItem {
  tipo: string;
  nombreArchivo: string; // tal cual viene en tu JSON
}

export interface InsertarCedulaRequest {
  cuenta_codigo: string;
  usuario_sistema_nombre: string;
  tipo_usuario: string;

  fecha_pantalla: string;     // 'YYYY-MM-DD'
  hora_pantalla: string;      // 'HH:mm:ss'

  tipo_tramite: string;       // 'Nueva cuenta' | ...
  personal_seguridad: boolean;

  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;
  sexo: string;
  fecha_nacimiento: string;   // 'YYYY-MM-DD'
  nacionalidad: string;
  pais_nacimiento: string;
  entidad_nacimiento: string;
  municipio_alcaldia: string;
  estado_civil: string;

  fecha_solicitud: string;    // 'YYYY-MM-DD'
  rfc: string;
  cuip: string;
  curp: string;

  correo_electronico: string;
  telefono: string;
  tiene_telegram: boolean;

  tipo_institucion: string;
  entidad: string;
  municipio: string;
  institucion: string;
  dependencia: string;
  corporacion: string;
  area: string;
  cargo: string;

  funciones: string;
  fecha_ingreso: string;      // 'YYYY-MM-DD'
  numero_empleado: string;

  esta_comisionado: boolean;
  pais_comision: string;
  tipo_institucion_comision: string;
  entidad_comision: string;
  municipio_comision: string;
  institucion_comision: string;
  dependencia_comision: string;
  corporacion_comision: string;
  especificar_comision: string;

  sistema: string;
  perfiles_json: PerfilItem[];        // 👈 ahora es arreglo real
  tipo_documento_sel: string;
  documentos_json: DocumentoItem[];   // 👈 ahora es arreglo real

  estado_solicitud: string;
  creado_por: number;
}
