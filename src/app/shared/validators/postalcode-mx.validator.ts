import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const postalCodeMxValidator = (): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  return /^\d{5}$/.test(v) ? null : { cpMx: true };
};
