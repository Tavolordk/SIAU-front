import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { REQUEST_API_BASE_URL } from '../core/token'; // asegúrate que el token exista y esté proveído
import { DocumentoDto, FinalizarRegistroDto, GuardarStep4Response } from '../models/solicitudes-step-form.models';
import { DocMeta, StepFormStateService } from '../step-form/state/step-form-state.service';

// ===== Tipos que tu componente está importando =====
export interface PageResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}

// OJO: el backend envía "año". Puedes tiparlo literal entre comillas.
export interface Solicitud {
  id: number;
  fill1: string;                 // numero_oficio
  folio: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  cuentaUsuario: string;
  correoElectronico?: string;
  telefono?: string;
  entidad: number;
  'año': number;
  mes: number;
  dia: number;
  municipio:   number;   // antes: number | null | undefined
  institucion: number;
  dependencia: number;
  corporacion: number;
  area:        number;

  // los demás pueden quedarse como estaban
  tipoUsuario?: number | null;
  cargo?: string | null;
  funciones?: string | null;
  pais?: string | null;

  // si usas estos en otros lados, puedes dejarlos opcionales:
  entidad2?: number | null;
  municipio2?: number | null;
  corporacion2?: number | null;
}


export interface CrearSolicitudRequest {
  areaId: number;
  asunto: string;
  descripcion: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  adjuntos?: { nombre: string; mime: string; base64: string }[];
}

 export interface SolicitarCodigoRes {
  canal: string;
  contacto: string;
  codigo?: string | null;   // en producción puede venir null
}

export interface VerificarCodigoRes {
  ok: boolean;
  reason: 'ok'|'not_found'|'already_used'|'expired'|'attempts_exceeded'|'invalid_code';
  attempts: number;
  maxAttempts: number;
  expiresAt?: string | null;
  canal: string;
  contacto: string;
  proposito: 'signup'|'change_contact'|'login'|'2fa';
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  constructor(
    private http: HttpClient,
    @Inject(REQUEST_API_BASE_URL) private baseUrl: string
  ) {}

  // ===== Mantengo "listar" si ya lo usas en otros lados =====
  listar(params: Record<string, any>) {
    return this.http.get<PageResult<Solicitud>>(
      `${this.baseUrl}/data/solicitudes`,
      { params }
    );
  }

  // ===== Alias con el nombre que usa tu componente =====
  getPage(page: number, userId?: number, pageSize = 10): Observable<PageResult<Solicitud>> {
    const params = new HttpParams({
      fromObject: {
        page: String(page),
        pageSize: String(pageSize),
        ...(userId != null ? { userId: String(userId) } : {})
      }
    });
    return this.http.get<PageResult<Solicitud>>(
      `${this.baseUrl}/data/solicitudes`,
      { params }
    );
  }

  crear(req: CrearSolicitudRequest) {
    return this.http.post<{ solicitudId: number; folio: string }>(
      `${this.baseUrl}/solicitudes`,
      req
    );
  }

  detalle(id: number) {
    return this.http.get<any>(`${this.baseUrl}/solicitudes/${id}`);
  }

  cambiarEstado(id: number, estado: string, motivo?: string) {
    return this.http.put(`${this.baseUrl}/solicitudes/${id}/estado`, { estado, motivo }, { observe: 'response' });
  }

  subirAdjunto(id: number, adjunto: { nombre: string; mime: string; base64: string }) {
    return this.http.post(`${this.baseUrl}/solicitudes/${id}/adjuntos`, adjunto, { observe: 'response' });
  }
    guardarStep4(payload: FinalizarRegistroDto): Observable<GuardarStep4Response> {
    return this.http.post<GuardarStep4Response>(`${this.baseUrl}/solicitudes/guardar-step4`, payload);
  }
  // src/app/solicitudes/services/solicitudes.service.ts
uploadTempDoc(tipoDocumentoId: number, file: File, fechaDocumento?: string) {
  const fd = new FormData();
  fd.append('tipoDocumentoId', String(tipoDocumentoId));
  if (fechaDocumento) fd.append('fechaDocumento', fechaDocumento);
  fd.append('file', file, file.name);
  return this.http.post<DocMeta>(`${this.baseUrl}/solicitudes/docs/temp`, fd);
}

deleteTempDoc(idTemp: number) {
  return this.http.delete<void>(`${this.baseUrl}/solicitudes/docs/temp/${idTemp}`);
}
buildFinalizarRegistroDto(state: StepFormStateService): FinalizarRegistroDto {
    const s1: any = state.get('step1') ?? {};
    const s2: any = state.get('step2') ?? {};
    const s3: any = state.get('step3') ?? {};
    const s4: any = state.get('step4') ?? {};
    const s5: any = state.get('step5') ?? {};

    // Perfiles -> Text8..Text63 (como espera el SP)
    const claves: string[] = (Array.isArray(s2?.perfiles) ? s2.perfiles : [])
      .map((p: any) => (p?.clave ?? p?.Clave ?? p?.id ?? '').toString())
      .filter((x: string) => !!x);

    const consultaTextos: Record<string, string|null> = {};
    const modulosOperacion: Record<string, string|null> = {};
    for (let i = 0; i < 28; i++)  consultaTextos[`Text${8 + i}`]  = claves[i] ?? null;
    for (let i = 28; i < 56; i++) modulosOperacion[`Text${8 + i}`] = claves[i] ?? null;

    // Documentos (si ya subiste y tienes metadatos)
    const documentos: DocumentoDto[] = Array.isArray(s3?.docs) ? s3.docs
      .filter((d: any) => !!d?.storageRuta)
      .map((d: any) => ({
        tipoDocumentoId: Number(d.tipoDocumentoId ?? d.TipoDocumentoId ?? 0),
        nombreOriginal: d.nombreOriginal ?? d.NombreOriginal ?? '',
        extension: d.extension ?? d.Extension ?? '',
        mimeType: d.mimeType ?? d.MimeType ?? '',
        tamanoBytes: Number(d.tamanoBytes ?? d.TamanoBytes ?? 0),
        storageProveedor: d.storageProveedor ?? d.StorageProveedor ?? 'LOCAL',
        storageRuta: d.storageRuta ?? d.StorageRuta ?? '',
        checksumSha256: d.checksumSha256 ?? d.ChecksumSha256 ?? '',
      })) : [];

    const dto: FinalizarRegistroDto = {
      RFC: s1.rfc ?? null,
      Nombre: s1.nombre ?? null,
      Nombre2: s1.nombre2 ?? null,
      ApellidoPaterno: s1.apellidoPaterno ?? null,
      ApellidoMaterno: s1.apellidoMaterno ?? null,
      CURP: s1.curp ?? null,
      CUIP: s1.cuip ?? null,

      Telefono: s4.celularContacto ?? s1.telefono ?? null,
      CorreoElectronico: s4.correoContacto ?? s1.correo ?? null,

      PaisId: 143, // ajusta si lo capturas en el flujo

      Cargo: s2.cargo ?? null,
      Funciones: s2.funciones ?? null,
      Funciones2: s2.funciones2 ?? null,

      TipoUsuario: s1.tipoUsuario ?? null,

      Entidad: s2.entidad ?? null,
      Municipio: s2.municipio ?? null,
      Area: s2.area ?? null,

      Entidad2: s2.entidad2 ?? null,
      Municipio2: s2.municipio2 ?? null,
      Pais2Id: 143,
      Corporacion2: s2.corporacion2 ?? null,

      CheckBox1_NuevaCuenta: true,
      CheckBox2_ModificaPerfiles: !!s2.chkModifica,
      CheckBox3_AmpliaPerfiles: !!s2.chkAmplia,
      CheckBox4_ReactivaCuenta: !!s2.chkReactiva,
      CheckBox5_CambioAdscripcion: !!s2.chkCambioAdscripcion,

      CuentaUsuario: s1.cuentaUsuario ?? null,
      Password: s1.password ?? null,
      NumeroOficio: s1.numeroOficio ?? null,
      FolioIn: s1.folio ?? null,

      ConsultaTextos: consultaTextos,
      ModulosOperacion: modulosOperacion,

      CorreoContacto: s4.correoContacto ?? null,
      CelularContacto: s4.celularContacto ?? null,
      TelOficinaContacto: s4.telOficinaContacto ?? null,
      ExtensionOficina: s4.extensionOficina ?? null,

      MedioValidacion: s4.medioValidacion ?? s5?.medioValidacion ?? null,

      Documentos: documentos
    };

    return dto;
  }
 
// --- pedir código al SP ---
solicitarCodigo$(
  canal: 'correo'|'telegram'|'sms',
  contacto: string,
  proposito: 'signup'|'change_contact'|'login'|'2fa',
  ttlSegundos = 900,
  maxIntentos = 5
) {
  const url = `${this.baseUrl}/solicitudes/solicitar-codigo`;
  return this.http.post<SolicitarCodigoRes>(url, {
    canal, contacto, proposito, ttlSegundos, maxIntentos
  });
}

// --- verificar código con el SP ---
verificarCodigo$(
  canal: 'correo'|'telegram'|'sms',
  contacto: string,
  proposito: 'signup'|'change_contact'|'login'|'2fa',
  codigo: string
) {
  const url = `${this.baseUrl}/solicitudes/verificar-codigo`;
  return this.http.post<VerificarCodigoRes>(url, {
    canal, contacto, proposito, codigo
  });
}

}
