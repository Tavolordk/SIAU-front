import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResult<T> {
  currentPage: number;
  pageSize:   number;
  totalPages: number;
  totalItems: number;
  items:      T[];
}

export interface Solicitud {
  id: number;
  fill1: string;
  folio: string;
  caducaEn: string | null;
  checkBox1: boolean;
  checkBox2: boolean;
  checkBox3: boolean;
  checkBox4: boolean;
  checkBox5: boolean;
  cuentaUsuario: string;
  correoElectronico: string;
  telefono: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombre: string;
  nombre2: string;
  rfc: string;
  dia: number;
  mes: number;
  año: number;
  cuip: string;
  curp: string | null;
  tipoUsuario: number;
  entidad: number;
  municipio: number;
  institucion: number;
  dependencia: number;
  corporacion: number;
  area: number;
  cargo: string;
  funciones: string;
  funciones2: string | null;
  pais: string;
  entidad2: number;
  municipio2: number;
  corporacion2: number | null;

  /** Textos Text8..Text35 */
  consultaTextos: Record<`Text${8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35}`, string>;

  /** Textos Text36..Text63 */
  modulosOperacion: Record<`Text${36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63}`, string>;

  firma1: any;
  firma2: any;
  firma3: any;
  ok: boolean;
  estadosolicitud: number;
  descripcionerror: string | null;
}


@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  // No hardcodees rutas: úsalo inyectado
  constructor(
    private http: HttpClient,
    @Inject('API_BASE_URL') private apiBaseUrl: string
  ) {}

  /** Trae una página de solicitudes desde GET https://…/data/solicitudes?page=X */
  getPage(page: number, userId: number): Observable<PageResult<Solicitud>> {
    const url = `${this.apiBaseUrl}/data/solicitudes`;
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('page',  page.toString());
    return this.http.get<PageResult<Solicitud>>(url, { params });
  }
  getSolicitud(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiBaseUrl}/${id}`);
  }
  /** Si tienes un endpoint para descargar PDF */
  downloadPdf(id: number): Observable<Blob> {
    const url = `${this.apiBaseUrl}/data/solicitudes/${id}/pdf`;
    return this.http.get(url, { responseType: 'blob' });
  }
    getPerfiles(): Observable<any[]> {
    const url = `${this.apiBaseUrl}/data/perfiles`; 
    // ⚠️ aquí debes poner el endpoint real que expone tu API de perfiles
    return this.http.get<any[]>(url);
  }
}
