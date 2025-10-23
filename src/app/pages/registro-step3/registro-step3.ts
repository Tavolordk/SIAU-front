import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn,
  ReactiveFormsModule, FormArray
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faTrashAlt, faArrowLeft, faArrowRight, faCloudUploadAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { StepFormStateService } from '../../step-form/state/step-form-state.service';
import { CatalogosService } from '../../services/catalogos.service';

interface TipoDoc { id: number; nombre: string; }
type Step3Doc = {
  file: File;
  tipoDocumentoId: number;
  storageRuta?: string;
  storageProveedor?: string;
  fechaDocumento: string | undefined;
};

@Component({
  selector: 'app-registro-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step3.html',
  styleUrls: ['./registro-step3.scss']
})
export class RegistroStep3Component implements OnInit, OnDestroy {
  // Header / progreso (inputs para que sea autónomo)
  @Input() currentStep = 3;
  @Input() maxSteps = 6;
  @Input() usuarioNombre = 'Luis Vargas';
  @Input() usuarioRol = 'Capturista';
  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<{ documentos: Step3Doc[] }>();

  get totalSteps() { return this.maxSteps; }
  get progressPercent() { return Math.round((this.currentStep / (this.maxSteps || 1)) * 100); }

  // Icons
  icEye = faEye;
  icTrash = faTrashAlt;
  icLeft  = faArrowLeft;
  icRight = faArrowRight;
  icUpload = faCloudUploadAlt;
  icUser = faUserCircle;

  // Catálogo
  tipos: TipoDoc[] = [];

  // Estado / formulario
  form!: FormGroup;
  loading = false;
  errorMsg = '';
  readonly hoy = this.getTodayLocalISO();

  // Límites/validaciones
  private readonly MAX_BYTES = 10 * 1024 * 1024;              // 10 MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'application/pdf'];
  private readonly ALLOWED_EXTS  = ['.jpg', '.jpeg', '.pdf'];

  constructor(
    private fb: FormBuilder,
    private state: StepFormStateService,
    private catalogos: CatalogosService
  ) {}

  // ========= Ciclo de vida =========
  ngOnInit(): void {
    // Form local (misma forma que el viejo)
    this.form = this.fb.group({
      tipoDocumento: [null, Validators.required],
      archivo: [null, [Validators.required, this.fileTypeValidator(), this.fileSizeValidator()]],
      documentos: this.fb.array<FormGroup>([])
    });

    // Cargar catálogo de tipos
    this.catalogos.getTiposDocumento$().subscribe(list => { this.tipos = list || []; });

    // Restaurar desde el estado
    const prevDocs = this.state.step3?.docs ?? [];
    prevDocs.forEach((d: Step3Doc) =>
      this.documentosFA.push(this.createDocGroup(d.file, d.tipoDocumentoId, d.fechaDocumento))
    );

    // Asegura sincronía inicial
    this.syncStateFromForm();
  }

  ngOnDestroy(): void {
    // Si tuvieras blobs generados y guardados, revócalos aquí (no generamos persistentes)
  }

  // ========= Getters / helpers =========
  get documentosFA(): FormArray<FormGroup> {
    return this.form.get('documentos') as FormArray<FormGroup>;
  }
  get archivoCtrl(): AbstractControl | null { return this.form.get('archivo'); }
  get tipoCtrl(): AbstractControl | null { return this.form.get('tipoDocumento'); }

  // totales para UI
  get totalBytes(): number {
    return this.documentosFA.controls.reduce((acc, g) => acc + Number(g.value.size || 0), 0);
  }
  get totalMB(): string { return (this.totalBytes / (1024 * 1024)).toFixed(2); }
  get remainingMB(): string { return Math.max(0, (this.MAX_BYTES - this.totalBytes) / (1024 * 1024)).toFixed(2); }

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

  // ========= Eventos UI =========
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.archivoCtrl?.setValue(f);
    this.archivoCtrl?.markAsTouched();
    this.archivoCtrl?.markAsDirty();
    this.archivoCtrl?.updateValueAndValidity({ emitEvent: true });
    this.form.updateValueAndValidity({ emitEvent: true });

    // Limpia el input para permitir volver a elegir el mismo archivo
    input.value = '';
  }

  get canUpload(): boolean {
    const tipoSel = this.tipoCtrl?.value != null;
    const fileSel = !!this.archivoCtrl?.value;
    return tipoSel && fileSel && !this.loading;
  }

  onUpload(): void {
    this.errorMsg = '';
    if (!this.canUpload) return;

    const tipoId = this.tipoCtrl!.value as number | null;
    const file = this.archivoCtrl!.value as File | null;
    if (!tipoId || !file) return;

    // Validación extra (además de los validators)
    const name = (file.name || '').toLowerCase();
    const extOk = this.ALLOWED_EXTS.some(ext => name.endsWith(ext));
    const mimeOk = this.ALLOWED_TYPES.includes(file.type);
    const sizeOk = (this.totalBytes + file.size) <= this.MAX_BYTES;
    if (!extOk || !mimeOk) { this.errorMsg = 'Solo se permiten archivos PDF o JPG.'; return; }
    if (!sizeOk) { this.errorMsg = 'El total supera 10 MB.'; return; }

    // Agregar al FormArray
    this.documentosFA.push(this.createDocGroup(file, tipoId, this.hoy));

    // Limpiar selección
    this.form.patchValue({ archivo: null /*, tipoDocumento: null*/ });

    // Sincronizar estado global
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

  // ========= Navegación =========
  onBack() { this.prev.emit(); }

  onNext() {
    if (!this.documentosFA.length) {
      this.errorMsg = 'Agrega al menos un documento.';
      return;
    }
    // persistimos y avisamos al contenedor
    this.syncStateFromForm();
    this.proceed.emit({ documentos: this.state.step3?.docs ?? [] });
  }

  // ========= Validadores =========
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

  // ========= Sync con StepFormStateService =========
  private syncStateFromForm() {
    const docs: Step3Doc[] = this.documentosFA.controls.map(g => ({
      file: g.value.file as File,
      tipoDocumentoId: g.value.tipoDocumentoId as number,
      storageRuta: g.value.storageRuta ?? undefined,
      storageProveedor: g.value.storageProveedor ?? undefined,
      fechaDocumento: g.value.fechaDocumento as string
    }));
    this.state.step3 = { ...(this.state.step3 ?? { docs: [] }), docs };
  }
}
