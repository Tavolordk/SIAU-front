// File: src/app/usuarios/models/cedula.model.ts

/**
 * Modelo TypeScript equivalente a CedulaModel de .NET
 */
export interface CedulaModel {
  id?: number;
  fill1: string;
  folio?: string;
  caducaEn?: number;
  checkBox1: boolean;
  checkBox2: boolean;
  checkBox3: boolean;
  checkBox4: boolean;
  checkBox5: boolean;
  cuentaUsuario?: string;
  correoElectronico: string;
  telefono?: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  nombre: string;
  nombre2?: string;
  rfc: string;
  dia?: number;
  mes?: number;
  año?: number;
  cuip?: string;
  curp?: string;
  tipoUsuario: number;
  entidad: number;
  municipio: number;
  institucion: number;
  dependencia: number;
  corporacion: number;
  area: number;
  cargo: string;
  funciones: string;
  funciones2?: string;
  pais?: string;
  entidad2?: number;
  municipio2?: number;
  corporacion2?: string;
  consultaTextos: Record<string, string>;
  modulosOperacion: Record<string, string>;
  firma1?: string;
  firma2?: string;
  firma3?: string;
  ok?: boolean;
  estadosolicitud?: number;
  descripcionerror?: string;
  descargar: boolean;
  opciones: boolean;
  perfiles: boolean;
  entidadNombre?: string;
  municipioNombre?: string;
  institucionNombre?: string;
  dependenciaNombre?: string;
  corporacionNombre?: string;
  areaNombre?: string;
  entidad2Nombre?: string;
  municipio2Nombre?: string;
  corporacion2Nombre?: string;
}
