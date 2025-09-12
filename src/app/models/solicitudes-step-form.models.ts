export interface DocumentoDto {
  tipoDocumentoId: number;
  nombreOriginal: string;
  extension: string;
  mimeType: string;
  tamanoBytes: number;
  storageProveedor: string;   // 'LOCAL' | 'S3' | etc
  storageRuta: string;        // ruta lógica/URL relativa
  checksumSha256: string;     // hex en minúsculas
}

export interface FinalizarRegistroDto {
  // ===== Pasos 1–2 + perfiles =====
  RFC?: string | null;
  Nombre?: string | null;
  Nombre2?: string | null;
  ApellidoPaterno?: string | null;
  ApellidoMaterno?: string | null;
  CURP?: string | null;
  CUIP?: string | null;
  Telefono?: string | null;
  CorreoElectronico?: string | null;
  PaisId: number;                 // default 143
  Cargo?: string | null;
  Funciones?: string | null;
  Funciones2?: string | null;
  TipoUsuario: number;
  Entidad: number | null;
  Municipio: number | null;
  Area: number | null;                   // p_area_estructura_id
  Entidad2: number | null;
  Municipio2: number | null;
  Pais2Id: number;                // default 143
  Corporacion2: number | null;           // p_estructura2_id

  CheckBox1_NuevaCuenta: boolean; // true
  CheckBox2_ModificaPerfiles: boolean;
  CheckBox3_AmpliaPerfiles: boolean;
  CheckBox4_ReactivaCuenta: boolean;
  CheckBox5_CambioAdscripcion: boolean;

  CuentaUsuario?: string | null;
  Password?: string | null;
  NumeroOficio?: string | null;   // p_numero_oficio
  FolioIn?: string | null;        // p_folio_in

  // Text8..Text63
  ConsultaTextos?: Record<string, string | null> | null;  // 8..35
  ModulosOperacion?: Record<string, string | null> | null; // 36..63

  // ===== Paso 4 =====
  CorreoContacto?: string | null;
  CelularContacto?: string | null;
  TelOficinaContacto?: string | null;
  ExtensionOficina?: string | null;

  // ===== Paso 3 =====
  Documentos?: DocumentoDto[] | null;

  // ===== Paso 5 =====
  MedioValidacion?: string | null; // 'EMAIL' | 'TELEGRAM' | 'SMS'...
}

export interface GuardarStep4Response {
  solicitudId: number;
  folio: string;
  personaId: number;
  usuarioId: number;
}
