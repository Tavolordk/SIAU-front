// File: src/app/models/cedula.mapper.model.ts
import { ExcelUsuarioRow } from '../models/excel.model';
import { CedulaModel } from '../services/pdf.service'; // modelo para PDF (lowercase)
import { CedulaModel as ApiCedula } from './cedula.model'; // si lo usas tipado para API
import { CatalogosService } from '../services/catalogos.service';
const stripAccentsUpper = (x: any) =>
  x == null
    ? null
    : String(x)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // quita diacríticos
        .toUpperCase()
        .trim();

const num = (v: any) => (typeof v === 'number' ? v : Number(v ?? 0)) || 0;
const maybe = (v: any) => (v == null || v === '' ? null : String(v));
const safe = (s?: string | null) => (s || 'SIN_NOMBRE').replace(/\s+/g, '_');
const toInt = (v: any) => Number.parseInt(String(v ?? 0), 10) || 0;
const nonEmpty = (s: any) => (s == null ? null : String(s).trim());
function pickFirst<T>(...vals: T[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'sí' || s === 'si';
  }
  return !!v;
}

/** Mapper para PDF/UI (se queda en minúsculas como lo tenías) */
export function mapExcelRowToCedula(row: ExcelUsuarioRow, cats: CatalogosService): CedulaModel {
  // Municipio puede venir como id o nombre
  const municipioId =
    typeof row.municipio === 'number'
      ? row.municipio
      : (row.municipio ? (cats.getMunicipioIdByName(row.municipio) ?? 0) : 0);

  // ENTIDAD: si hay municipio, tomar su padre; si no, toma lo que venga del excel
  let entidadId = 0;
  if (municipioId > 0) {
    const padre = cats.getEntidadIdByMunicipioId(municipioId);
    if (padre) entidadId = padre;
  } else {
    entidadId = typeof row.entidad === 'number' ? row.entidad : Number(row.entidad) || 0;
  }
  // ⚠️ IMPORTANTE: ya NO sobreescribimos entidadId después

  const entidad2Id =
    typeof row.entidad2 === 'number'
      ? row.entidad2
      : (row.entidad2 ? (cats.getEntidadIdByName(row.entidad2) ?? 0) : 0);

  const municipio2Id =
    typeof row.municipio2 === 'number'
      ? row.municipio2
      : (row.municipio2 ? (cats.getMunicipioIdByName(row.municipio2) ?? 0) : 0);

  const corporacion2Id =
    typeof row.corporacion2 === 'number'
      ? row.corporacion2
      : (row.corporacion2 ? (cats.getCorporacionIdByName(row.corporacion2) ?? 0) : 0);

  const institucionId = num(row.institucion);
  const dependenciaId = num(row.dependencia);
  const corporacionId = num(row.corporacion);
  const areaId = num(row.area);
  const tipoUsuarioId = num(row.tipoUsuario);

  const model: CedulaModel = {
    // Identificadores
    fill1: maybe(row.fill1),
    folio: maybe(row.fill1),

    // Persona / contacto
    cuentaUsuario: maybe(row.cuentaUsuario),
    correoElectronico: maybe(row.correoElectronico),
    telefono: maybe(row.telefono),
    apellidoPaterno: maybe(row.apellidoPaterno),
    apellidoMaterno: maybe(row.apellidoMaterno),
    nombre: maybe(row.nombre),
    nombre2: maybe(row.nombre2),
    rfc: maybe(row.rfc),
    cuip: maybe(row.cuip),
    curp: maybe(row.curp),

    // Estructura (IDs)
    tipoUsuario: tipoUsuarioId,
    entidad: entidadId,          // estado (derivado del municipio si existe)
    municipio: num(municipioId), // municipio (lo importante para el SP)
    institucion: institucionId,
    corporacion: corporacionId,
    area: areaId,

    // Puesto
    cargo: maybe(row.cargo),
    funciones: maybe(row.funciones),
    funciones2: '',

    // Ubicación alternativa
    pais: maybe(row.pais),
    entidad2: entidad2Id || null,
    municipio2: municipio2Id || null,
    corporacion2: corporacion2Id || null,

    // Permisos
    consultaTextos: row.consultaTextos || {},
    modulosOperacion: row.modulosOperacion || {},

    // Checks
    checkBox1: !!row.checkBox1,
    checkBox2: !!row.checkBox2,
    checkBox3: !!row.checkBox3,
    checkBox4: !!row.checkBox4,
    checkBox5: !!row.checkBox5,

    // Nombres legibles (para PDF/UI)
    entidadNombre: entidadId ? (cats.getEntidadNameById(entidadId) || '') : '',
    municipioNombre:
      typeof row.municipio === 'number'
        ? (cats.getMunicipioNameById(num(row.municipio)) || '')
        : (row.municipio || ''),
    institucionNombre: cats.getInstitucionNameById(institucionId) || '',
    dependenciaNombre: cats.getDependenciaNameById(dependenciaId) || '',
    corporacionNombre: cats.getCorporacionNameById(corporacionId) || '',
    areaNombre: cats.getAreaNameById(areaId) || '',
    entidad2Nombre: entidad2Id ? (cats.getEntidadNameById(entidad2Id) || '') : (row.entidad2 as any) || '',
    municipio2Nombre: municipio2Id ? (cats.getMunicipioNameById(municipio2Id) || '') : (row.municipio2 as any) || '',
    corporacion2Nombre: corporacion2Id ? (cats.getCorporacionNameById(corporacion2Id) || '') : (row.corporacion2 as any) || '',

    // Firmas
    nombreFirmaEnlace: maybe(row.nombreFirmaEnlace),
    nombreFirmaResponsable: maybe(row.nombreFirmaResponsable),
    nombreFirmaUsuario: maybe(row.nombreFirmaUsuario),
  };

  return model;
}

/** Nombre de archivo PDF */
export function pdfFileName(model: CedulaModel): string {
  return `CED_${safe(model.nombre)}_${safe(model.apellidoPaterno)}_${safe(model.apellidoMaterno)}.pdf`;
}

/**
 * NUEVO: mapper SOLO para el POST al backend (.NET) — cuerpo PLANO con PascalCase.
 * Envía Municipio (ID del municipio) y Area (ID del área).
 */
export function mapExcelRowToSolicitudBody(
  row: ExcelUsuarioRow,
  cats: CatalogosService,
  userId: number = 0
) {
  const m = mapExcelRowToCedula(row, cats);

  return {
    // --- Campos personales/solicitud (PascalCase como en tu backend) ---
RFC:               stripAccentsUpper(m.rfc),
    Nombre:            stripAccentsUpper(m.nombre),
    nombre2:           stripAccentsUpper(m.nombre2),
    ApellidoPaterno:   stripAccentsUpper(m.apellidoPaterno),
    ApellidoMaterno:   stripAccentsUpper(m.apellidoMaterno),
    CURP:              stripAccentsUpper(m.curp),
    CUIP:              stripAccentsUpper(m.cuip),
    Telefono:          stripAccentsUpper(m.telefono),
    CorreoElectronico: stripAccentsUpper(m.correoElectronico),
    Pais:              stripAccentsUpper(m.pais),
    Pais2:              stripAccentsUpper(m.pais),
    Cargo:             stripAccentsUpper(m.cargo),
    Funciones:         stripAccentsUpper(m.funciones),
    Funciones2:        stripAccentsUpper(m.funciones2),

    TipoUsuario: toInt(m.tipoUsuario),

    // ⚠️ Importante para el SP:
    Municipio: toInt(m.municipio),  // va a @p_Entidad en el SP (debe ser un municipio válido)
    Area:      toInt(m.area),       // va a @p_Area en el SP

    // Checks
    CheckBox1: !!m.checkBox1,
    CheckBox2: !!m.checkBox2,
    CheckBox3: !!m.checkBox3,
    CheckBox4: !!m.checkBox4,
    CheckBox5: !!m.checkBox5,

    // Folio/Oficio y Perfiles
    Fill1: stripAccentsUpper(m.fill1),
    Folio: stripAccentsUpper(m.folio),
    ConsultaTextos: m.consultaTextos || {},  // debe traer Text8..Text63 con las claves
    ModulosOperacion: m.modulosOperacion || {},

    // UserId para bitácora / fallback en el SP
    UserId: userId
  };
}

/**
 * Mapper de un modelo de cédula ya construido (por ejemplo desde formulario) a cuerpo PLANO.
 */
export function mapCedulaToSolicitudBody(m: ApiCedula, userId: number = 0) {
  const checksArr = (m as any).checks as boolean[] | undefined;

  const cb1 = toBool(pickFirst((m as any).CheckBox1, (m as any).checkBox1, checksArr?.[0]));
  const cb2 = toBool(pickFirst((m as any).CheckBox2, (m as any).checkBox2, checksArr?.[1]));
  const cb3 = toBool(pickFirst((m as any).CheckBox3, (m as any).checkBox3, checksArr?.[2]));
  const cb4 = toBool(pickFirst((m as any).CheckBox4, (m as any).checkBox4, checksArr?.[3]));
  const cb5 = toBool(pickFirst((m as any).CheckBox5, (m as any).checkBox5, checksArr?.[4]));
  return {
RFC:              stripAccentsUpper(m.rfc),
    Nombre:           stripAccentsUpper(m.nombre),
    nombre2:          stripAccentsUpper((m as any).nombre2),
    ApellidoPaterno:  stripAccentsUpper(m.apellidoPaterno),
    ApellidoMaterno:  stripAccentsUpper(m.apellidoMaterno),
    CURP:             stripAccentsUpper(m.curp),
    CUIP:             stripAccentsUpper(m.cuip),
    Telefono:         stripAccentsUpper(m.telefono),
    CorreoElectronico:stripAccentsUpper(m.correoElectronico),
    Pais:             stripAccentsUpper(m.pais),
    Cargo:            stripAccentsUpper(m.cargo),
    Funciones:        stripAccentsUpper(m.funciones),
    Funciones2:       stripAccentsUpper(m.funciones2),

    TipoUsuario: toInt(m.tipoUsuario),

    Municipio: toInt((m as any).Municipio ?? (m as any).municipio),
    Area:      toInt((m as any).Area ?? (m as any).area),

    CheckBox1: cb1,
    CheckBox2: cb2,
    CheckBox3: cb3,
    CheckBox4: cb4,
    CheckBox5: cb5,

    Fill1: stripAccentsUpper((m as any).Fill1 ?? (m as any).fill1),
    Folio: stripAccentsUpper((m as any).Folio ?? (m as any).folio),
    ConsultaTextos: (m as any).ConsultaTextos ?? (m as any).consultaTextos ?? {},
    ModulosOperacion: (m as any).ModulosOperacion ?? (m as any).modulosOperacion ?? {},

    UserId: userId
  };
}
