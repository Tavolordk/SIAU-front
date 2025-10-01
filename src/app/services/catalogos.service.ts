// src/app/services/catalogos.service.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environmentCatalog } from '../environments/environments.catalogos';
import { firstValueFrom, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { CATALOG_API_BASE_URL } from '../core/token';
import { REQUEST_API_BASE_URL } from '../core/token';

// Respuesta del microservicio de Solicitudes
type PerfilItemApi = { clave: string; descripcion: string };

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
export interface CatPaisesDto { id: number; nombre: string; ISO2?: string; ISO3?: string }
export interface CatAmbitoDto { id: number, descripcion: string }
export interface CatSexoDto { id: number; descripcion: string; }
export interface CatEstadoCivilDto { id: number; descripcion: string; }
export interface CatNacionalidadDto { id: number; descripcion: string; pais_id: number; pais: string; }
export interface CatTipoDocumentoDto { id: number; nombre: string; }

export interface CatalogosResponseDto {
  TipoUsuario: TipoUsuarioDto[];
  Entidades: CatEntiDto[];      // Estados (FK_PADRE=null) y Municipios (FK_PADRE!=null)
  Estructura: CatEstructuraDto[]; // INSTITUCION/DEPENDENCIA/CORPORACION/AREA
  Perfiles: CatPerfilDto[];
  Paises: CatPaisesDto[];
  Ambito: CatAmbitoDto[];
  Sexos: CatSexoDto[];
  EstadosCiviles: CatEstadoCivilDto[];
  Nacionalidades: CatNacionalidadDto[];
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  tiposDocumento: CatalogoItem[] = [];
  private tiposDocumento$!: Observable<CatalogoItem[]>;
  perfiles: { id: number; clave: string; nombre: string }[] = [];
  /** Catálogos “planos” para UI */
  entidades: CatalogoItem[] = [];
  municipios: CatalogoItem[] = [];
  instituciones: CatalogoItem[] = [];
  dependencias: CatalogoItem[] = [];
  corporaciones: CatalogoItem[] = [];
  areas: CatalogoItem[] = [];
  tiposUsuario: CatalogoItem[] = [];
  paises: CatalogoItem[] = [];
  ambito: CatalogoItem[] = [];
  sexos: CatalogoItem[] = [];
  estadosCiviles: CatalogoItem[] = [];
  nacionalidades: CatalogoItem[] = [];


  /** Respaldo crudo con FK_PADRE (clave del fix) */
  private _entidadesRaw: CatEntiDto[] = [];

  /** Índice de municipios por entidad */
  private _munByEntidad = new Map<number, CatalogoItem[]>();

  /** Endpoint base para catálogos */
  private url = `${environmentCatalog.apiBaseUrl}/catalogos/tpusuario`;

  /** Cache de la respuesta completa */
  private allCatalogos$!: Observable<CatalogosResponseDto>;

  constructor(private http: HttpClient, @Inject(CATALOG_API_BASE_URL) private baseUrl: string,
    @Inject(REQUEST_API_BASE_URL) private solicitudesBaseUrl: string) {
    this.url = `${this.baseUrl}/catalogos/tpusuario`;
    this.allCatalogos$ = this.http.get<CatalogosResponseDto>(this.url).pipe(shareReplay(1));

    // Construye catálogos e índices una sola vez
    // CatalogosService
    this.allCatalogos$ = this.http.get<CatalogosResponseDto>(this.url).pipe(
      tap(res => {
        // normaliza Entidades
        const raw = (res.Entidades ?? []).map(e => ({
          id: e.id, nombre: e.nombre, tipo: (e.tipo || '').toLowerCase(), fK_PADRE: e.fK_PADRE
        }));
        this._entidadesRaw = raw;
        this.entidades = raw.filter(e => e.fK_PADRE == null && e.tipo === 'estado')
          .map(e => ({ id: e.id, nombre: e.nombre }));

        // índice de municipios por entidad
        this._munByEntidad.clear();
        raw.filter(e => e.fK_PADRE != null).forEach(m => {
          const list = this._munByEntidad.get(m.fK_PADRE!) ?? [];
          list.push({ id: m.id, nombre: m.nombre });
          this._munByEntidad.set(m.fK_PADRE!, list);
        });

        // estructura normalizada
        const estr = (res.Estructura ?? []).map(x => ({
          id: x.id, nombre: x.nombre, tipo: (x.tipo || '').toLowerCase(), fK_PADRE: x.fK_PADRE
        }));
        this.instituciones = estr.filter(x => x.tipo === 'institucion' && x.fK_PADRE == null)
          .map(x => ({ id: x.id, nombre: x.nombre }));
        this.dependencias = estr.filter(x => x.tipo === 'dependencia').map(x => ({ id: x.id, nombre: x.nombre }));
        this.corporaciones = estr.filter(x => x.tipo === 'corporacion').map(x => ({ id: x.id, nombre: x.nombre }));
        this.areas = estr.filter(x => x.tipo === 'area').map(x => ({ id: x.id, nombre: x.nombre }));

        this.paises = (res.Paises ?? []).map(p => ({ id: p.id, nombre: p.nombre }));
        // Ámbito -> "Tipo de institución"
        this.ambito = (res.Ambito ?? []).map(a => ({ id: a.id, nombre: a.descripcion }));

        // Sexos
        this.sexos = (res.Sexos ?? []).map(s => ({ id: s.id, nombre: s.descripcion }));

        // Estados civiles
        this.estadosCiviles = (res.EstadosCiviles ?? []).map(ec => ({ id: ec.id, nombre: ec.descripcion }));

        // Nacionalidades (mostramos gentilicio)
        this.nacionalidades = (res.Nacionalidades ?? []).map(n => ({
          id: n.id,
          nombre: n.descripcion,
        }));
        this.tiposUsuario = (res.TipoUsuario ?? []).map(t => ({
          id: t.id,
          nombre: t.tP_USUARIO
        }));
        const urlTipos = `${this.baseUrl}/catalogos/tipos-documentos`;
        this.tiposDocumento$ = this.http.get<CatTipoDocumentoDto[]>(urlTipos).pipe(
          map(rows => rows.map(r => ({ id: r.id, nombre: r.nombre }))),
          tap(list => (this.tiposDocumento = list)),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  }

  /** Normaliza strings para comparaciones */
  private norm(s: string) { return (s || '').trim().toUpperCase(); }

  /** Carga completa (resumida por shareReplay) */
  getAll(): Observable<CatalogosResponseDto> {
    return this.allCatalogos$;
  }

  getPaisNameById(id: number): string | null {
    const hit = this.paises.find(p => p.id === id);
    return hit ? hit.nombre : null;
  }

  getPaisIdByName(nombre: string): number | null {
    const n = (nombre || '').trim().toUpperCase();
    const hit = this.paises.find(p => p.nombre.trim().toUpperCase() === n);
    return hit ? hit.id : null;
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
  getAmbito$() {
    return this.allCatalogos$.pipe(map(() => this.ambito));
  }

  // Alias legible si en el form lo llamas "tipoInstitucion"
  getTiposInstitucion$() {
    return this.getAmbito$();
  }

  getSexos$() {
    return this.allCatalogos$.pipe(map(() => this.sexos));
  }

  getEstadosCiviles$() {
    return this.allCatalogos$.pipe(map(() => this.estadosCiviles));
  }

  getNacionalidades$() {
    return this.allCatalogos$.pipe(map(() => this.nacionalidades));
  }

  // (opcionales pero útiles para binds)
  getEntidades$() {
    return this.allCatalogos$.pipe(map(() => this.entidades));
  }


  async ensureReady(): Promise<void> {
    await firstValueFrom(this.allCatalogos$);
  }
  // en CatalogosService
  private _depByInst = new Map<number, CatalogoItem[]>();
  private _corpByDep = new Map<number, CatalogoItem[]>();
  private _areaByCorp = new Map<number, CatalogoItem[]>();

  // … dentro del tap(res => { ... }) llena los mapas como te pasé antes …

  getInstituciones$() {
    return this.allCatalogos$.pipe(map(() => this.instituciones));
  }
  getDependencias$(institucionId: number) {
    return this.allCatalogos$.pipe(map(() => this._depByInst.get(institucionId) ?? []));
  }
  getCorporaciones$(dependenciaId: number) {
    return this.allCatalogos$.pipe(map(() => this._corpByDep.get(dependenciaId) ?? []));
  }
  getTiposUsuario$() {
    return this.allCatalogos$.pipe(map(() => this.tiposUsuario));
  }
  getAreas$(corporacionId: number) {               // 👈 nuevo
    return this.allCatalogos$.pipe(map(() => this._areaByCorp.get(corporacionId) ?? []));
  }
  getPaises$() {                                   // 👈 nuevo
    return this.allCatalogos$.pipe(map(() => this.paises));
  }
    getTiposDocumento$(): Observable<CatalogoItem[]> {
    return this.tiposDocumento$;
  }

  // (opcional) sincrónico por si lo necesitas en pipes puros
  getTipoDocumentoNameById(id: number): string | null {
    const hit = this.tiposDocumento.find(t => t.id === id);
    return hit ? hit.nombre : null;
    // Si quieres “live”, usa getTiposDocumento$ y map()
  }
  /** Perfiles por estructura: envía SOLO el id más específico ≠ 0 (area>corporacion>dependencia>institucion) */
  getPerfilesPorEstructuraAuto$(
    ids: { institucionId?: number | null; dependenciaId?: number | null; corporacionId?: number | null; areaId?: number | null }
  ) {
    const url = `${this.solicitudesBaseUrl}/api/solicitudes/perfiles-por-estructura`;

    // normaliza a 0 si viene null/NaN/etc.
    const norm = (n?: number | null) => (typeof n === 'number' && isFinite(n) && n > 0 ? n : 0);

    const area = norm(ids.areaId);
    const corporacion = norm(ids.corporacionId);
    const dependencia = norm(ids.dependenciaId);
    const institucion = norm(ids.institucionId);

    let params = new HttpParams();
    if (area > 0) {
      params = params.set('areaId', String(area));
    } else if (corporacion > 0) {
      params = params.set('corporacionId', String(corporacion));
    } else if (dependencia > 0) {
      params = params.set('dependenciaId', String(dependencia));
    } else if (institucion > 0) {
      params = params.set('institucionId', String(institucion));
    }
    // si todos son 0, va sin params → el backend devuelve todos los perfiles

    return this.http.get<PerfilItemApi[]>(url, { params }).pipe(
      map(rows =>
        rows.map((r, i) => ({
          id: i + 1,            // cambia a r.id cuando tu API exponga cp.id
          clave: r.clave,
          funcion: r.descripcion
        }))
      )
    );
  }

}
