import { AbstractControl, ValidatorFn } from '@angular/forms';

function toISO(v: any): string | null {
  if (!v && v !== 0) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0,10);
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export function dateISOValidator(): ValidatorFn {
  return (c: AbstractControl) => {
    const iso = toISO(c.value);
    if (!iso) return { dateInvalid: true };
    const dt = new Date(iso + 'T00:00:00');
    return isNaN(dt.getTime()) ? { dateInvalid: true } : null;
  };
}

export function minDate(minISO: string): ValidatorFn {
  return (c: AbstractControl) => {
    const iso = toISO(c.value);
    if (!iso) return null;
    return iso < minISO ? { minDate: { min: minISO, actual: iso } } : null;
  };
}

export function maxDate(maxISO: string): ValidatorFn {
  return (c: AbstractControl) => {
    const iso = toISO(c.value);
    if (!iso) return null;
    return iso > maxISO ? { maxDate: { max: maxISO, actual: iso } } : null;
  };
}

/** Valida que c >= control 'otherName' (útil para fechaIngreso >= fechaNacimiento) */
export function afterOrEqualControl(otherName: string): ValidatorFn {
  return (c: AbstractControl) => {
    const iso = toISO(c.value);
    const otherIso = toISO(c.parent?.get(otherName)?.value);
    if (!iso || !otherIso) return null; // otra regla se encargará de required
    return iso >= otherIso ? null : { after: { other: otherName } };
  };
}
