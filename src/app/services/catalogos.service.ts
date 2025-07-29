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
    entidades: CatalogoItem[]       = []; // llenado al iniciar la app
  municipios: CatalogoItem[]      = [];
  instituciones: CatalogoItem[]   = [];
  dependencias: CatalogoItem[]    = [];
  corporaciones: CatalogoItem[]   = [];
  areas: CatalogoItem[]           = [];
  private url = `${environment.apiBaseUrl}/catalogos/tpusuario`;
  private allCatalogos$!: Observable<CatalogosResponseDto>;
  tiposUsuario: CatalogoItem[]=[];

  constructor(private http: HttpClient) {
    // Inicializar la caché aquí, tras asignar http
    this.allCatalogos$ = this.http.get<CatalogosResponseDto>(this.url).pipe(
      shareReplay(1)
    );
     this.allCatalogos$.subscribe(res => {
      this.tiposUsuario    = res.TipoUsuario
                                .map(u => ({ id: u.ID, nombre: u.TP_USUARIO }));
      this.entidades       = res.Entidades
                                .filter(e => e.TIPO === 'ESTADO')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
      this.municipios      = res.Entidades
                                .filter(e => e.TIPO === 'MUNICIPIO')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
      this.instituciones   = res.Estructura
                                .filter(e => e.TIPO === 'INSTITUCION')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
      this.dependencias    = res.Estructura
                                .filter(e => e.TIPO === 'DEPENDENCIA')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
      this.corporaciones   = res.Estructura
                                .filter(e => e.TIPO === 'CORPORACION')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
      this.areas           = res.Estructura
                                .filter(e => e.TIPO === 'AREA')
                                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
    });
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
    getEntidadIdByName(nombre: string): number | null {
    const item = this.entidades.find(e => e.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

  getMunicipioIdByName(nombre: string): number | null {
    const item = this.municipios.find(m => m.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

  getInstitucionIdByName(nombre: string): number | null {
    const item = this.instituciones.find(i => i.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

  getDependenciaIdByName(nombre: string): number | null {
    const item = this.dependencias.find(d => d.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

  getCorporacionIdByName(nombre: string): number | null {
    const item = this.corporaciones.find(c => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

  getAreaIdByName(nombre: string): number | null {
    const item = this.areas.find(a => a.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    return item ? item.id : null;
  }

   getTipoUsuarioNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.tiposUsuario.find(t => t.id === id);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre de la Entidad (Estado) dado su ID.
   */
  getEntidadNameById(id: number): string | null {
    console.log('ID: Entidades' + id);
    const item = this.entidades.find(e => e.id === id);
    console.log(item);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre del Municipio dado su ID
   */
  getMunicipioNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.municipios.find(m => m.id === id);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre de la Institución dado su ID.
   */
  getInstitucionNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.instituciones.find(i => i.id === id);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre de la Dependencia dado su ID.
   */
  getDependenciaNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.dependencias.find(d => d.id === id);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre de la Corporación dado su ID.
   */
  getCorporacionNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.corporaciones.find(c => c.id === id);
    return item ? item.nombre : null;
  }

  /**
   * Obtiene el nombre del Área dado su ID.
   */
  getAreaNameById(id: number): string | null {
    console.log('ID:' + id);
    const item = this.areas.find(a => a.id === id);
    return item ? item.nombre : null;
  }
}
