import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faTrashAlt, faArrowLeft, faArrowRight, faCloudUploadAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";
type DocRow = {
  type: string;
  name: string;
  size: number;          // bytes
  url: string;           // blob URL para visualizar
  mime: string;
};

@Component({
  selector: 'app-registro-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step3.html',
  styleUrls: ['./registro-step3.scss']
})
export class RegistroStep3Component implements OnDestroy {
  // Encabezado (demo)
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  // Paso/progreso
  totalSteps = 6;
  currentStep = 3;
  get progressPercent() { return Math.round((this.currentStep / this.totalSteps) * 100); }

  // Icons
  icEye = faEye;
  icTrash = faTrashAlt;
  icLeft  = faArrowLeft;
  icRight = faArrowRight;
  icUpload = faCloudUploadAlt;
  icUser = faUserCircle;

  // Form
  form: FormGroup;

  // Config
  readonly maxTotalBytes = 10 * 1024 * 1024; // 10 MB
  readonly allowedExt = ['pdf', 'jpg', 'jpeg'];
  readonly allowedMime = ['application/pdf', 'image/jpeg']; // (jpg/jpeg)

  // UI state
  picking = false;
  pickedFileName = '';

  // Tipos de documento disponibles
  docTypes: string[] = [
    'Identificación oficial (INE)',
    'Recibo de nómina (quincena inmediata anterior)',
    'Credencial laboral'
  ];

  // Tabla
  rows: DocRow[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      docType: [{ value: '', disabled: false }, Validators.required],
      file: [null, Validators.required]
    });
  }

  // Tamaño total actual
  get totalBytes(): number {
    return this.rows.reduce((acc, r) => acc + r.size, 0);
  }
  get totalMB(): string {
    return (this.totalBytes / (1024 * 1024)).toFixed(2);
  }
  get remainingMB(): string {
    const remain = (this.maxTotalBytes - this.totalBytes) / (1024 * 1024);
    return Math.max(0, remain).toFixed(2);
  }

  triggerPick(fileInput: HTMLInputElement) {
    this.picking = true;
    fileInput.click();
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.picking = false;
    this.pickedFileName = file?.name ?? '';
    this.form.patchValue({ file: file ?? null });
    // Limpia el input para permitir re-selección del mismo archivo
    input.value = '';
  }

  private invalidTypeOrSize(file: File): string | null {
    if (!file) return 'No se seleccionó archivo.';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!this.allowedExt.includes(ext) ||
        !this.allowedMime.includes(file.type || '')) {
      return 'Formato no permitido. Solo PDF o JPG.';
    }
    if (this.totalBytes + file.size > this.maxTotalBytes) {
      return 'Se supera el límite total de 10MB.';
    }
    return null;
  }

  upload() {
    const docType = this.form.get('docType')!.value as string;
    const file: File | null = this.form.get('file')!.value;

    if (!docType) return;
    if (!file) return;

    const error = this.invalidTypeOrSize(file);
    if (error) { alert(error); return; }

    // Evita duplicar tipo: si ya existe, reemplaza (o elimina esta parte si permites repetidos)
    const idx = this.rows.findIndex(r => r.type === docType);
    if (idx >= 0) this.delete(idx);

    const url = URL.createObjectURL(file);
    this.rows.push({
      type: docType,
      name: file.name,
      size: file.size,
      url,
      mime: file.type
    });

    this.pickedFileName = '';
    this.form.patchValue({ file: null });
  }

  view(row: DocRow) {
    window.open(row.url, '_blank');
  }

  delete(i: number) {
    const row = this.rows[i];
    if (row?.url) URL.revokeObjectURL(row.url);
    this.rows.splice(i, 1);
  }

  onBack() {
    // TODO: router.navigate(['/registro/step2']);
    console.log('Regresar a Step 2');
  }

  onNext() {
    // TODO: router.navigate(['/registro/step4']);
    console.log('Docs:', this.rows);
  }

  ngOnDestroy(): void {
    // Limpia blobs
    this.rows.forEach(r => r.url && URL.revokeObjectURL(r.url));
  }
get docTypeCtrl(): FormControl<string> {
  return this.form.get('docType') as FormControl<string>;
}
get fileCtrl(): FormControl<File | null> {
  return this.form.get('file') as FormControl<File | null>;
}
}
