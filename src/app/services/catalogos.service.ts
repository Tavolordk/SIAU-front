// src/app/services/catalogos.service.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environmentCatalog } from '../environments/environments.catalogos';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { CATALOG_API_BASE_URL } from '../core/token';

/** Opción genérica (para selects / PDF) */
export interface CatalogoItem {
  id: number;
  nombre: string;
}

/** DTOs que refleja tu API */
export interface TipoUsuarioDto { id: number; tP_USUARIO: string; }
export interface CatEntiDto { id: number; nombre: string; tipo: string; fK_PADRE: number | null; }
export interface CatEstructuraDto { id: number; nombre: string; tipo: string; fK_PADRE: number | null; }
export interface CatPerfilDto { id: number; clave: string; funcion: string; }

export interface CatalogosResponseDto {
  TipoUsuario: TipoUsuarioDto[];
  Entidades: CatEntiDto[];      // Estados (FK_PADRE=null) y Municipios (FK_PADRE!=null)
  Estructura: CatEstructuraDto[]; // INSTITUCION/DEPENDENCIA/CORPORACION/AREA
  Perfiles: CatPerfilDto[];
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  perfiles: { id: number; clave: string; nombre: string }[] = [];
  /** Catálogos “planos” para UI */
  entidades: CatalogoItem[] = [];
  municipios: CatalogoItem[] = [];
  instituciones: CatalogoItem[] = [];
  dependencias: CatalogoItem[] = [];
  corporaciones: CatalogoItem[] = [];
  areas: CatalogoItem[] = [];
  tiposUsuario: CatalogoItem[] = [];

  /** Respaldo crudo con FK_PADRE (clave del fix) */
  private _entidadesRaw: CatEntiDto[] = [];

  /** Índice de municipios por entidad */
  private _munByEntidad = new Map<number, CatalogoItem[]>();

  /** Endpoint base para catálogos */
  private url = `${environmentCatalog.apiBaseUrl}/catalogos/tpusuario`;

  /** Cache de la respuesta completa */
  private allCatalogos$!: Observable<CatalogosResponseDto>;

  constructor(private http: HttpClient, @Inject(CATALOG_API_BASE_URL) private baseUrl: string) {
    this.url = `${this.baseUrl}/catalogos/tpusuario`;
    this.allCatalogos$ = this.http.get<CatalogosResponseDto>(this.url).pipe(shareReplay(1));

    // Construye catálogos e índices una sola vez
    this.allCatalogos$.subscribe((res) => {
      // Guarda crudo (con FK_PADRE)
      this._entidadesRaw = res.Entidades ?? [];

      // Tipos de usuario
      this.tiposUsuario = (res.TipoUsuario ?? []).map(u => ({ id: u.id, nombre: u.tP_USUARIO }));

      // Estados y Municipios para UI
      this._entidadesRaw = res.Entidades ?? [];

      // Tipos de usuario
      this.tiposUsuario = (res.TipoUsuario ?? [])
        .map(u => ({ id: u.id, nombre: u.tP_USUARIO }));

      // Estados (tipo=ESTADO) y Municipios (fK_PADRE != null)
      this.entidades = this._entidadesRaw
        .filter(e => e.fK_PADRE == null && e.tipo === 'ESTADO')
        .map(e => ({ id: e.id, nombre: e.nombre }));

      this.municipios = this._entidadesRaw
        .filter(e => e.fK_PADRE != null)
        .map(e => ({ id: e.id, nombre: e.nombre }));

      // Índice municipios por entidad
      this._munByEntidad.clear();
      for (const e of this._entidadesRaw) {
        if (e.fK_PADRE != null) {
          const arr = this._munByEntidad.get(e.fK_PADRE) || [];
          arr.push({ id: e.id, nombre: e.nombre });
          this._munByEntidad.set(e.fK_PADRE, arr);
        }
      }


      // Estructura
      // Estructura: 1=INSTITUCION, 2=DEPENDENCIA, 3=CORPORACION, 4=AREA (según tu JSON)
      const estr = res.Estructura ?? [];
      this.instituciones = estr
        .filter(e => e.tipo === '1' && (e.fK_PADRE == null))
        .map(e => ({ id: e.id, nombre: e.nombre }));
      this.dependencias = estr.filter(e => e.tipo === '2').map(e => ({ id: e.id, nombre: e.nombre }));
      this.corporaciones = estr.filter(e => e.tipo === '3').map(e => ({ id: e.id, nombre: e.nombre }));
      this.areas = estr.filter(e => e.tipo === '4').map(e => ({ id: e.id, nombre: e.nombre }));

      // Perfiles
      this.perfiles = (res.Perfiles ?? [])
        .map(p => ({ id: p.id, clave: p.clave, nombre: p.funcion }));
    });
  }

  /** Normaliza strings para comparaciones */
  private norm(s: string) { return (s || '').trim().toUpperCase(); }

  /** Carga completa (resumida por shareReplay) */
  getAll(): Observable<CatalogosResponseDto> {
    return this.allCatalogos$;
  }

  /** Municipios por entidad usando índice (rápido y seguro) */
  getMunicipios(entidadId: number): Observable<CatalogoItem[]> {
    return this.allCatalogos$.pipe(
      map(() => this._munByEntidad.get(entidadId) ?? [])
    );
  }

  // -----------------------
  // Lookups por NOMBRE → ID
  // -----------------------

  getEntidadIdByName(nombre: string): number | null {
    const n = this.norm(nombre);
    const hit = this._entidadesRaw.find(e => e.fK_PADRE === null && this.norm(e.nombre) === n);
    return hit ? hit.id : null;
  }

  /** Busca municipio por nombre; si se pasa entidadId, restringe la búsqueda */
  getMunicipioIdByName(nombre: string, entidadId?: number): number | null {
    const n = this.norm(nombre);
    if (entidadId) {
      const lista = this._entidadesRaw.filter(e => e.fK_PADRE === entidadId);
      const hit = lista.find(e => this.norm(e.nombre) === n);
      return hit ? hit.id : null;
    }
    // Evita usar esta ruta sin entidad si puedes (puede haber homónimos)
    const any = this._entidadesRaw.find(e => e.fK_PADRE !== null && this.norm(e.nombre) === n);
    return any ? any.id : null;
  }

  getInstitucionIdByName(nombre: string): number | null {
    const n = this.norm(nombre);
    const hit = this.instituciones.find(i => this.norm(i.nombre) === n);
    return hit ? hit.id : null;
  }

  getDependenciaIdByName(nombre: string): number | null {
    const n = this.norm(nombre);
    const hit = this.dependencias.find(d => this.norm(d.nombre) === n);
    return hit ? hit.id : null;
  }

  getCorporacionIdByName(nombre: string): number | null {
    const n = this.norm(nombre);
    const hit = this.corporaciones.find(c => this.norm(c.nombre) === n);
    return hit ? hit.id : null;
  }

  getAreaIdByName(nombre: string): number | null {
    const n = this.norm(nombre);
    const hit = this.areas.find(a => this.norm(a.nombre) === n);
    return hit ? hit.id : null;
  }

  // -----------------------
  // Lookups por ID → NOMBRE
  // -----------------------

  getTipoUsuarioNameById(id: number): string | null {
    const hit = this.tiposUsuario.find(t => t.id === id);
    return hit ? hit.nombre : null;
  }

  getEntidadNameById(id: number): string | null {
    const hit = this._entidadesRaw.find(e => e.id === id);
    return hit ? hit.nombre : null;
  }

  getMunicipioNameById(id: number): string | null {
    const hit = this._entidadesRaw.find(e => e.id === id);
    return hit ? hit.nombre : null;
  }

  getInstitucionNameById(id: number): string | null {
    const hit = this.instituciones.find(i => i.id === id);
    return hit ? hit.nombre : null;
  }

  getDependenciaNameById(id: number): string | null {
    const hit = this.dependencias.find(d => d.id === id);
    return hit ? hit.nombre : null;
  }

  getCorporacionNameById(id: number): string | null {
    const hit = this.corporaciones.find(c => c.id === id);
    return hit ? hit.nombre : null;
  }

  getAreaNameById(id: number): string | null {
    const hit = this.areas.find(a => a.id === id);
    return hit ? hit.nombre : null;
  }

  // -----------------------
  // Validaciones de relación
  // -----------------------

  /** Verifica si un municipio pertenece a una entidad (via FK_PADRE) */
  isMunicipioDeEntidad(munId: number, entidadId: number): boolean {
    const m = this._entidadesRaw.find(e => e.id === munId && e.fK_PADRE !== null);
    return !!m && m.fK_PADRE === entidadId;
  }
  getEntidadIdByMunicipioId(municipioId: number): number | null {
    const muni = this._entidadesRaw.find(e => e.id === municipioId);
    return muni?.fK_PADRE ?? null;
  }
}
