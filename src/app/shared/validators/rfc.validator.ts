import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const RFC_RE = /^([A-ZÑ&]{3,4})(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([A-Z0-9]{3})$/;

const TABLA_DV: Record<string, number> = (() => {
  const chars = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';
  const map: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) map[chars[i]] = i;
  return map;
})();

function dvOk(rfc: string) {
  const body = rfc.slice(0, -1);
  const dv = rfc.slice(-1);
  let suma = 0;
  const n = body.length;
  for (let i = 0; i < n; i++) {
    suma += (TABLA_DV[body[i]] ?? 0) * (n + 1 - i);
  }
  const resto = suma % 11;
  const calc = resto === 0 ? '0' : resto === 1 ? 'A' : String(11 - resto);
  return calc === dv;
}

export function rfcValidator(opts: { checkDV?: boolean } = {}): ValidatorFn {
  const { checkDV = true } = opts;
  return (c: AbstractControl): ValidationErrors | null => {
    const v = (c.value ?? '').toString().trim().toUpperCase();
    if (!v) return null;
    if (!RFC_RE.test(v)) return { rfcFormat: true };
    if (checkDV && !dvOk(v)) return { rfcDV: true };
    return null;
  };
}

export const isRfcValid = (v: string, checkDV = true) =>
  rfcValidator({ checkDV })({ value: v } as any) === null;
