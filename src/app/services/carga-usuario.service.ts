import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CedulaModel } from '../models/cedula.model';
import { environment } from '../environments/environment';

/**
 * Opción de catálogo con id y nombre
 */
export interface Opcion { id: number; nombre: string; }

@Injectable({ providedIn: 'root' })
export class CargaUsuarioService {
  private baseUrl = '/api/cedula';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una cédula por su id
   */
  getUsuario(id: number): Observable<CedulaModel> {
    return this.http.get<CedulaModel>(`${this.baseUrl}/${id}`);
  }
  /**
   * Catálogos para selects
   */
  getTiposUsuario(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/tiposUsuario');
  }

  getEntidades(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/entidades');
  }

  getMunicipios(entidadId: number): Observable<Opcion[]> {
    const params = new HttpParams().set('entidadId', entidadId.toString());
    return this.http.get<Opcion[]>('/api/catalogs/municipios', { params });
  }

  getDependencias(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/dependencias');
  }

  getCorporaciones(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/corporaciones');
  }

  getInstituciones(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/instituciones');
  }

  getAreas(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>('/api/catalogs/areas');
  }
  saveUsuarioSolicitud(cedula: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/data/solicitudes`, cedula);
  }
}
