// src/app/usuarios/cedula-model.builder.ts
import { CedulaModel } from '../models/cedula.model';
import { ExcelUsuarioRow } from '../models/excel.model';

export function buildCedulaModelFromExcelRow(row: ExcelUsuarioRow): CedulaModel {
  const toNumberOrUndefined = (v: any): number | undefined => {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};
  return {
    fill1: row.fill1 || '',
    folio: '', // lo genera el backend
    cuentaUsuario: row.cuentaUsuario || '',
    correoElectronico: row.correoElectronico || '',
    telefono: row.telefono || '',
    apellidoPaterno: row.apellidoPaterno || '',
    apellidoMaterno: row.apellidoMaterno || undefined,
    nombre: row.nombre || '',
    nombre2: row.nombre2 || undefined,
    rfc: row.rfc || '',
    cuip: row.cuip || undefined,
    curp: row.curp || undefined,
    tipoUsuario: row.tipoUsuario || 0,
    entidad: row.entidad || 0,
    municipio: (() => {
        // en tus rows a veces es string
        const m = row.municipio;
        return m == null ? null : (typeof m === 'string' ? (isNaN(+m) ? null : +m) : m);
    })() || 0,
    institucion: row.institucion || 0,
    corporacion: row.corporacion,
    area: row.area,
    cargo: row.cargo || '',
    funciones: row.funciones || '',
    funciones2: '', // si lo llenas en otro lugar, ajusta
    pais: row.pais || undefined,
    entidad2: toNumberOrUndefined(row.entidad2),
    municipio2: toNumberOrUndefined(row.municipio2),
    corporacion2: row.corporacion2 ?? undefined,

    consultaTextos: row.consultaTextos || {},
    modulosOperacion: row.modulosOperacion || {},
    checkBox1: !!row.checkBox1,
    checkBox2: !!row.checkBox2,
    checkBox3: !!row.checkBox3,
    checkBox4: !!row.checkBox4,
    checkBox5: !!row.checkBox5,
    entidadNombre: '', // si tu API lo necesita puedes resolverlo antes de llamar
    municipioNombre: '',
    institucionNombre: '',
    dependenciaNombre: '',
    corporacionNombre: '',
    areaNombre: '',
    entidad2Nombre: '',
    municipio2Nombre: '',
    corporacion2Nombre: '',
    descargar: false,
    opciones: false,
    perfiles: false,
    dependencia: 0
};
}
