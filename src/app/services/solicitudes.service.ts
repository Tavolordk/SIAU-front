import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { REQUEST_API_BASE_URL } from '../core/token'; // asegúrate que el token exista y esté proveído

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
}
