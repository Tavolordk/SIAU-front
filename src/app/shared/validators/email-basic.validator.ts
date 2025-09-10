import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Ligero: útil junto con Validators.email si quieres doble chequeo
const RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const emailBasicValidator = (): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  return RE.test(v) ? null : { emailBasic: true };
};
