import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CedulaModel } from '../models/cedula.model';
import { environment } from '../environments/environment';   // asegúrate que tiene apiUrl
import { mapCedulaToSolicitudBody, mapExcelRowToSolicitudBody } from '../models/cedula.mapper.model';
import { ExcelUsuarioRow } from '../models/excel.model';
import { CatalogosService } from './catalogos.service';        // <— NUEVO
import { UsuarioService } from './usuario.service';

export interface Opcion { id: number; nombre: string; }

@Injectable({ providedIn: 'root' })
export class CargaUsuarioService {
  private baseUrl = '/api/cedula';
  private api = environment.apiBaseUrl;                            // <— NUEVO (ej: https://localhost:7462)

  // inyecta CatalogosService para mapear nombres→IDs
  constructor(private http: HttpClient, private cat: CatalogosService, private usuarioSvc:UsuarioService ) {}  // <— NUEVO

  getUsuario(id: number): Observable<CedulaModel> {
    return this.http.get<CedulaModel>(`${this.baseUrl}/${id}`);
  }

  getTiposUsuario(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/tiposUsuario'); }
  getEntidades(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/entidades'); }
  getMunicipios(entidadId: number): Observable<Opcion[]> {
    const params = new HttpParams().set('entidadId', entidadId.toString());
    return this.http.get<Opcion[]>('/api/catalogs/municipios', { params });
  }
  getDependencias(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/dependencias'); }
  getCorporaciones(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/corporaciones'); }
  getInstituciones(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/instituciones'); }
  getAreas(): Observable<Opcion[]> { return this.http.get<Opcion[]>('/api/catalogs/areas'); }

  saveUsuarioSolicitud(row: ExcelUsuarioRow) {
    const body = mapExcelRowToSolicitudBody(row, this.cat);    // <— ya tienes municipio como int y cedula presente
    body.UserId = this.usuarioSvc.getUserId() ?? 0;         // <- acá, a nivel raíz
    console.log('[POST body]', body);                          // opcional
    return this.http.post(`${this.api}/data/solicitudes`, body); // POST JSON
  }

    saveSolicitudFromCedula(model: CedulaModel) {
    const body = mapCedulaToSolicitudBody(model);
        body.UserId = this.usuarioSvc.getUserId() ?? 0;         // <- acá, a nivel raíz  
    console.log('[POST body]', body); // verifica que vayan poblados
    return this.http.post(`${this.api}/data/solicitudes`, body);
  }
}
