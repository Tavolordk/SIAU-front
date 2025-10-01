// src/app/step-form/step3/step3.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn,
  ReactiveFormsModule, FormArray
} from '@angular/forms';
import { StepFormStateService } from '../state/step-form-state.service';
import { CatalogosService } from '../../services/catalogos.service';

interface TipoDoc { id: number; nombre: string; }
type Step3Doc = {
  file: File;
  tipoDocumentoId: number;
  storageRuta?: string;
  storageProveedor?: string;
  // requerida, pero puede venir undefined:
  fechaDocumento: string | undefined;
};

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
  loading = false;
  errorMsg = '';

  tipos: TipoDoc[] = [];   // ← antes tenías hardcodeado


  // Fecha de hoy (local, no UTC) y no editable
  hoy = this.getTodayLocalISO();
  form!: FormGroup;
  // ======= Form =======


  constructor(private fb: FormBuilder, private state: StepFormStateService, private catalogos: CatalogosService) {
    this.form = this.fb.group({
      tipoDocumento: [null, Validators.required],
      archivo: [null, [Validators.required, this.fileTypeValidator(), this.fileSizeValidator()]],
      documentos: this.fb.array<FormGroup>([])
    });
  }

  ngOnInit(): void {
    // 1) Carga tipos de documento desde el catálogo
    this.catalogos.getTiposDocumento$().subscribe(list => {
      this.tipos = list;
      // Si venías con state previo y el ID existe, no hacemos nada especial:
      // el select ya mostrará la opción correcta por el formControl.
    });
    // Sembrar desde el state existente (mantenemos la misma forma para Step 4)
    const prevDocs = this.state.step3?.docs ?? [];
    prevDocs.forEach((d: { file: File; tipoDocumentoId: number; fechaDocumento: string | undefined; }) => this.documentosFA.push(this.createDocGroup(d.file, d.tipoDocumentoId, d.fechaDocumento)));
    // Si no traía fecha, asegura hoy
    this.syncStateFromForm();
  }

  // ====== Getters / helpers ======
  get documentosFA(): FormArray<FormGroup> {
    return this.form.get('documentos') as FormArray<FormGroup>;
  }
  get archivoCtrl(): AbstractControl | null { return this.form.get('archivo'); }
  nombreTipo(id: number) { return this.tipos.find(t => t.id === id)?.nombre ?? `Tipo ${id}`; }

  private getTodayLocalISO(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private createDocGroup(file: File, tipoId: number, fecha?: string): FormGroup {
    return this.fb.group({
      tipoDocumentoId: [tipoId, Validators.required],
      fechaDocumento: [fecha || this.hoy, Validators.required],
      file: [file, Validators.required],
      storageRuta: [null],
      storageProveedor: [null],
      nombreArchivo: [file.name],
      mimeType: [file.type],
      size: [file.size]
    });
  }

  // ====== Eventos UI ======
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.archivoCtrl?.setValue(f);
    this.archivoCtrl?.markAsTouched();
    this.archivoCtrl?.markAsDirty();
    this.archivoCtrl?.updateValueAndValidity({ emitEvent: true });
    this.form.updateValueAndValidity({ emitEvent: true });
  }


  onUpload(): void {
    this.errorMsg = '';

    // 1) Validaciones mínimas
    this.errorMsg = '';
    if (!this.canUpload) return;

    const tipoId = this.form.get('tipoDocumento')!.value as number | null;
    const file = this.archivoCtrl!.value as File | null;

    if (!tipoId || !file) { return; }

    // 2) Valida tipo/tamaño acá (además de los validators)
    const name = (file.name || '').toLowerCase();
    const extOk = ['.jpg', '.jpeg', '.pdf'].some(ext => name.endsWith(ext));
    const sizeOk = file.size <= 10 * 1024 * 1024;
    if (!extOk) { this.errorMsg = 'Solo PDF o JPG.'; return; }
    if (!sizeOk) { this.errorMsg = 'Máximo 10 MB.'; return; }

    // 3) Agrega al FormArray con fecha = hoy
    this.documentosFA.push(this.createDocGroup(file, tipoId, this.hoy));

    // 4) Limpia input file (y opcionalmente el tipo)
    this.form.patchValue({ archivo: null /*, tipoDocumento: null*/ });
    const el = document.getElementById('fileInput') as HTMLInputElement | null;
    if (el) el.value = '';

    // 5) Sincroniza al StepFormStateService
    this.syncStateFromForm();
  }


  onRemoveAt(i: number) {
    this.documentosFA.removeAt(i);
    this.syncStateFromForm();
  }

  onViewAt(i: number) {
    const file = this.documentosFA.at(i).get('file')!.value as File;
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  onSiguiente() {
    if (!this.documentosFA.length) {
      this.errorMsg = 'Agrega al menos un documento.';
      return;
    }
    this.next.emit(this.currentStep + 1);
  }

  // ===== Validadores =====
  private readonly MAX_BYTES = 10 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'application/pdf'];
  private readonly ALLOWED_EXTS = ['.jpg', '.jpeg', '.pdf'];

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

  // ===== Sincroniza con StepFormStateService manteniendo la misma forma =====
  private syncStateFromForm() {
    const docs: Step3Doc[] = this.documentosFA.controls.map(g => ({
      file: g.value.file as File,
      tipoDocumentoId: g.value.tipoDocumentoId as number,
      storageRuta: g.value.storageRuta ?? undefined,
      storageProveedor: g.value.storageProveedor ?? undefined,
      fechaDocumento: g.value.fechaDocumento as string // requerido
    }));
    this.state.step3 = { ...(this.state.step3 ?? { docs: [] }), docs };
  }
  get canUpload(): boolean {
    const tipoSel = this.form.get('tipoDocumento')?.value != null;
    const fileSel = !!this.form.get('archivo')?.value;
    return tipoSel && fileSel && !this.loading;
  }


}
