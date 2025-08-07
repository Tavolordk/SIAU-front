// src/app/step-form/step3/step3.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  ReactiveFormsModule
} from '@angular/forms';

@Component({
  selector: 'app-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step3.html',
  styleUrls: ['./step3.scss']
})
export class Step3Component {
  @Input() currentStep = 3;
  @Input() maxSteps = 5;

  @Output() next = new EventEmitter<number>();
  @Output() prev = new EventEmitter<number>();
  @Output() upload = new EventEmitter<FormData>(); // emitimos FormData listo para subir

  form: FormGroup;

  // Restricciones
  private readonly MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'application/pdf'];
  private readonly ALLOWED_EXTS = ['.jpg', '.jpeg', '.pdf']; // respaldo por extensión

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tipoDocumento: ['', Validators.required],
      fechaDocumento: ['', Validators.required],
      archivo: [
        null,
        [
          Validators.required,
          this.fileTypeValidator(),
          this.fileSizeValidator()
        ]
      ]
    });
  }

  get archivoCtrl(): AbstractControl | null {
    return this.form.get('archivo');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.archivoCtrl?.setValue(file);
    this.archivoCtrl?.markAsTouched();
    this.archivoCtrl?.updateValueAndValidity({ onlySelf: true });
  }

  onUpload(): void {
    if (this.form.invalid || !this.archivoCtrl?.value) {
      this.form.markAllAsTouched();
      return;
    }

    const fd = new FormData();
    fd.append('tipoDocumento', this.form.value.tipoDocumento);
    fd.append('fechaDocumento', this.form.value.fechaDocumento);
    fd.append('archivo', this.archivoCtrl.value as File);

    // Lanzas el evento al padre para que haga la llamada HTTP
    this.upload.emit(fd);
  }

  // ===== Validadores personalizados =====
  private fileTypeValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const file = control.value as File | null;
      if (!file) return null;

      const mimeOk = this.ALLOWED_TYPES.includes(file.type);
      // Respaldo por extensión por si el navegador no define bien el MIME
      const name = (file.name || '').toLowerCase();
      const extOk = this.ALLOWED_EXTS.some(ext => name.endsWith(ext));

      return mimeOk || extOk ? null : { fileType: true };
    };
  }

  private fileSizeValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const file = control.value as File | null;
      if (!file) return null;

      return file.size <= this.MAX_BYTES
        ? null
        : { fileSize: { max: this.MAX_BYTES } };
    };
  }
}
