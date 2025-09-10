import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const notOnlyWhitespaceValidator = (): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null =>
    (c.value != null && /^\s+$/.test(String(c.value))) ? { onlyWhitespace: true } : null;
