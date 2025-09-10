import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const RE = /^\d{7,10}$/;

export const phoneMxValidator = (): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;              // deja 'required' para vacío
  return RE.test(v) ? null : { phoneMx: true };
};
