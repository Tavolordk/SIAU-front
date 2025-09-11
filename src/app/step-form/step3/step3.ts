// src/app/step-form/step3/step3.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { StepFormStateService } from '../state/step-form-state.service';

interface TipoDoc { id: number; nombre: string; }
type Step3Doc = { file: File; tipoDocumentoId: number; storageRuta?: string; storageProveedor?: string; fechaDocumento?: string };

@Component({
  selector: 'app-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step3.html',
  styleUrls: ['./step3.scss']
})
export class Step3Component implements OnInit {
  @Input() currentStep = 3;
  @Input() maxSteps = 5;
  @Output() next = new EventEmitter<number>();
  @Output() prev = new EventEmitter<number>();

  form: FormGroup;
  loading = false;
  errorMsg = '';

  tipos: TipoDoc[] = [];
  docs: Step3Doc[] = [];

  private readonly MAX_BYTES = 10 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'application/pdf'];
  private readonly ALLOWED_EXTS  = ['.jpg', '.jpeg', '.pdf'];

  constructor(private fb: FormBuilder, private state: StepFormStateService) {
    this.form = this.fb.group({
      tipoDocumento: [null, Validators.required],
      fechaDocumento: [''], // opcional (solo UI)
      archivo: [null, [Validators.required, this.fileTypeValidator(), this.fileSizeValidator()]],
    });
  }

  ngOnInit(): void {
    // Catálogo (cámbialo por tu servicio si ya lo tienes)
    this.tipos = [
      { id: 1, nombre: 'COMPROBANTE DE IDENTIFICACIÓN' },
      { id: 2, nombre: 'COMPROBANTE DE DOMICILIO' },
      { id: 3, nombre: 'COMPROBANTE LABORAL' },
    ];

    // Restaurar lo que haya en memoria (StepFormStateService.step3 NO se persiste en LS)
    const prevDocs = this.state.step3?.docs ?? [];
    this.docs = [...prevDocs];
  }

  // ===== helpers =====
  get archivoCtrl(): AbstractControl | null { return this.form.get('archivo'); }
  nombreTipo(id: number) { return this.tipos.find(t => t.id === id)?.nombre ?? `Tipo ${id}`; }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.archivoCtrl?.setValue(f);
    this.archivoCtrl?.markAsTouched();
    this.archivoCtrl?.updateValueAndValidity({ onlySelf: true });
  }

  // Agrega a la lista local y a StepFormState (sin subir todavía)
  onUpload(): void {
    this.errorMsg = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const tipoId: number = this.form.value.tipoDocumento;
    const fecha = this.form.value.fechaDocumento || '';
    const file: File = this.archivoCtrl!.value as File;

    const item: Step3Doc = { file, tipoDocumentoId: tipoId, fechaDocumento: fecha };
    this.docs = [...this.docs, item];
    this.state.step3 = { ...(this.state.step3 ?? { docs: [] }), docs: this.docs };

    // limpiar input file
    this.form.patchValue({ archivo: null });
    const el = document.getElementById('fileInput') as HTMLInputElement | null;
    if (el) el.value = '';
  }

  onRemove(doc: Step3Doc, idx: number) {
    this.docs = this.docs.filter((_, i) => i !== idx);
    this.state.step3 = { ...(this.state.step3 ?? { docs: [] }), docs: this.docs };
  }

  onView(doc: Step3Doc) {
    const url = URL.createObjectURL(doc.file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  onSiguiente() {
    if (!this.docs.length) { this.errorMsg = 'Agrega al menos un documento.'; return; }
    this.next.emit(this.currentStep + 1);
  }

  // ===== Validadores =====
  private fileTypeValidator(): ValidatorFn {
    return (c: AbstractControl) => {
      const file = c.value as File | null;
      if (!file) return null;
      const mimeOk = this.ALLOWED_TYPES.includes(file.type);
      const name = (file.name || '').toLowerCase();
      const extOk = this.ALLOWED_EXTS.some(ext => name.endsWith(ext));
      return (mimeOk || extOk) ? null : { fileType: true };
    };
  }
  private fileSizeValidator(): ValidatorFn {
    return (c: AbstractControl) => {
      const file = c.value as File | null;
      if (!file) return null;
      return file.size <= this.MAX_BYTES ? null : { fileSize: { max: this.MAX_BYTES } };
    };
  }
}
