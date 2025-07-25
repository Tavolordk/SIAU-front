import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * Elemento genérico de catálogo (id y nombre) para usar en selects y PDF
 */
export interface CatalogoItem {
  id: number;
  nombre: string;
}

// DTOs que reflejan la respuesta de tu API
export interface TipoUsuarioDto { ID: number; TP_USUARIO: string; }
export interface CatEntiDto { ID: number; NOMBRE: string; TIPO: string; FK_PADRE: number | null; }
export interface CatEstructuraDto { ID: number; NOMBRE: string; TIPO: string; FK_PADRE: number | null; }
export interface CatPerfilDto { ID: number; CLAVE: string; FUNCION: string; }

export interface CatalogosResponseDto {
  TipoUsuario: TipoUsuarioDto[];
  Entidades: CatEntiDto[];
  Estructura: CatEstructuraDto[];
  Perfiles: CatPerfilDto[];
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private url = `${environment.apiBaseUrl}/catalogos/tpusuario`;
  private allCatalogos$!: Observable<CatalogosResponseDto>;

  constructor(private http: HttpClient) {
    // Inicializar la caché aquí, tras asignar http
    this.allCatalogos$ = this.http.get<CatalogosResponseDto>(this.url).pipe(
      shareReplay(1)
    );
  }

  /**
   * Trae todos los datos de catálogos (tipos de usuario, entidades, estructura, perfiles)
   */
  getAll(): Observable<CatalogosResponseDto> {
    return this.allCatalogos$;
  }

  /**
   * Devuelve municipios filtrando Entidades por FK_PADRE
   */
  getMunicipios(entidadId: number): Observable<CatalogoItem[]> {
    return this.allCatalogos$.pipe(
      map(res => 
        res.Entidades
           .filter(e => e.FK_PADRE === entidadId)
           .map(e => ({ id: e.ID, nombre: e.NOMBRE }))
      )
    );
  }
}
