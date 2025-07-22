import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Solicitud {
  id: number;
  folio: string;
  oficio: string;
  nombre: string;
  usuario: string;
  entidad: string;    // ya en forma de nombre
  fecha: string;      // ISO string: '2025-07-22T...'
}

export interface PageResult {
  items: Solicitud[];
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private baseUrl = '/api/solicitudes';

  constructor(private http: HttpClient) {}

  /** Trae una página de solicitudes */
  getPage(page: number): Observable<PageResult> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PageResult>(`${this.baseUrl}/paged`, { params });
  }

  /** Descarga el PDF de la solicitud */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
