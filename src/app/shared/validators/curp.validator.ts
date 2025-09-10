import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida CURP SIN checar el código de estado.
 * Mantiene: formato general, fecha YYMMDD y (opcional) dígito verificador.
 *
 * Estructura (18):
 *  1-4  : letra inicial + vocal interna + 2 letras
 *  5-10 : YYMMDD
 *  11   : H/M
 *  12-13: cualquier par de letras A-Z (ya NO validamos contra catálogo de estados)
 *  14-16: consonantes internas
 *  17   : homoclave [0-9A-Z]
 *  18   : dígito verificador [0-9]
 */
const CURP_RE = new RegExp(
  '^' +
  '([A-Z][AEIOUX][A-Z]{2})' +                     // 1-4
  '(\\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])' + // 5-10
  '([HM])' +                                      // 11
  '([A-Z]{2})' +                                  // 12-13 (SIN validar catálogo)
  '([B-DF-HJ-NP-TV-Z]{3})' +                      // 14-16
  '([0-9A-Z])' +                                  // 17
  '(\\d)$'                                        // 18
);

function fechaOk(yy: number, mm: number, dd: number) {
  const y = yy <= 29 ? 2000 + yy : 1900 + yy;
  const d = new Date(y, mm - 1, dd);
  return d.getFullYear() === y && d.getMonth() === (mm - 1) && d.getDate() === dd;
}

// Dígito verificador (opcional)
// Dígito verificador (corregido)
function dvOk(curp: string) {
  const mapa = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const val = (c: string) => mapa.indexOf(c);

  let suma = 0;
  for (let i = 0; i < 17; i++) {
    const v = val(curp[i]);
    if (v < 0) return false;        // seguridad por si algo raro se cuela
    suma += v * (18 - i);           // <-- pesos 18..2 (corregido)
  }
  const dv = (10 - (suma % 10)) % 10;
  return dv === Number(curp[17]);
}


export function curpValidator(opts: { checkDV?: boolean } = {}): ValidatorFn {
  const { checkDV = true } = opts;
  return (c: AbstractControl): ValidationErrors | null => {
    const raw = (c.value ?? '').toString().trim().toUpperCase();
    if (!raw) return null; // 'required' se encarga del vacío

    const m = CURP_RE.exec(raw);
    if (!m) return { curpFormat: true };

    const yy = Number(m[2]), mm = Number(m[3]), dd = Number(m[4]);
    if (!fechaOk(yy, mm, dd)) return { curpDate: true };

    if (checkDV && !dvOk(raw)) return { curpDV: true };

    return null;
  };
}

export const isCurpValid = (v: string, checkDV = true) =>
  curpValidator({ checkDV })({ value: v } as any) === null;
