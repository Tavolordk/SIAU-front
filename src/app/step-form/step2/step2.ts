import { Component, Input, Output, EventEmitter, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CatalogosService, CatPerfilDto } from '../../services/catalogos.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { StepFormStateService } from '../state/step-form-state.service';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './step2.html',
  styleUrls: ['./step2.scss']
})
export class Step2Component implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() currentStep!: number;
  @Input() maxSteps!: number;

  @Output() addPerfil    = new EventEmitter<void>();
  @Output() removePerfil = new EventEmitter<number>();
  @Output() next         = new EventEmitter<void>();
  @Output() prev         = new EventEmitter<void>();

  // Catálogo y listas
  @Input() perfiles: CatPerfilDto[] = [];
  perfilesDisponibles: CatPerfilDto[] = [];
  perfilesAgregados: CatPerfilDto[] = [];

  // UI
  perfilPlaceholder = 'Ej: 3101 SUPERVISOR IPH';
  triedSubmit = false;

  // Persistencia
  private readonly stepKey = 'step2';
  private destroy$ = new Subject<void>();
  private restoreBuffer: CatPerfilDto[] | null = null;

  constructor(
    private fb: FormBuilder,
    private catalogosService: CatalogosService,
    private state: StepFormStateService,
    private el: ElementRef<HTMLElement>
  ) {}

ngOnInit(): void {
  // Construye el form si no viene del padre
  if (!this.form) {
    this.form = this.fb.group({
      perfil: this.fb.control<CatPerfilDto | null>(null),
      perfiles: this.fb.array([], [this.minLengthArray(1)]) // ← FormArray!
    });
  } else {
    // Si vino del padre, asegúrate de que 'perfil' y 'perfiles' existan y 'perfiles' sea FormArray
    if (!this.form.get('perfil')) {
      this.form.addControl('perfil', this.fb.control<CatPerfilDto | null>(null));
    }
    if (!(this.form.get('perfiles') instanceof FormArray)) {
      this.form.removeControl('perfiles');
      this.form.addControl('perfiles', this.fb.array([], [this.minLengthArray(1)]));
    }
  }

  // Persistencia mientras escribe (opcional)
  this.form.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe(v => this.state.save(this.stepKey, v, /*persist*/ false));

  // Restaurar si había guardado algo
  const prev = this.state.get(this.stepKey) as any;
  if (prev) {
    this.form.patchValue({ perfil: prev.perfil ?? null }, { emitEvent: false });
    if (Array.isArray(prev.perfiles) && prev.perfiles.length) {
      this.perfilesAgregados = [...prev.perfiles];
      this.setPerfilesFA(prev.perfiles); // ← ver helper abajo
    }
  }

  // Cargar catálogo
  if (!this.perfiles?.length) {
    this.catalogosService.getAll().subscribe(res => {
      this.perfiles = res.Perfiles ?? [];
      this.rebuildDisponibles();
    });
  } else {
    this.rebuildDisponibles();
  }
}

private setPerfilesFA(items: CatPerfilDto[]) {
  const fa = this.perfilesFA;
  while (fa.length) fa.removeAt(0);
  for (const it of items) {
    fa.push(this.fb.control(it, { nonNullable: true }));
  }
  fa.updateValueAndValidity({ emitEvent: false });
}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
private ensureControls(): void {
  // si el padre te pasó un form, puede venir sin estos controles
  if (!this.form) {
    this.form = this.fb.group({});
  }
  if (!this.form.get('perfil')) {
    this.form.addControl('perfil', this.fb.control<CatPerfilDto|null>(null));
  }
  if (!this.form.get('perfiles')) {
    this.form.addControl(
      'perfiles',
      this.fb.control<CatPerfilDto[]>([], { validators: [this.minLengthArray(1)], nonNullable: true })
    );
  }
}

  // ---------- Validación ----------
  private atLeastOnePerfil() {
    return (c: AbstractControl): ValidationErrors | null => {
      const arr = (c.value as CatPerfilDto[]) || [];
      return arr.length > 0 ? null : { minLengthArray: { requiredLength: 1 } };
    };
  }

  invalid(ctrl: string) {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.touched || c.dirty || this.triedSubmit);
  }
  hasError(ctrl: string, code: string) {
    const c = this.form.get(ctrl);
    return !!c && c.hasError(code) && (c.touched || c.dirty || this.triedSubmit);
  }

  // ---------- Lógica UI ----------
  private rebuildDisponibles() {
    const usados = new Set(this.perfilesAgregados.map(p => p.id));
    this.perfilesDisponibles = (this.perfiles || []).filter(p => !usados.has(p.id));

    // Si restauraste y el catálogo llegó después, asegúrate de alinear la UI
    if (this.restoreBuffer && this.restoreBuffer.length) {
      this.perfilesAgregados = [...this.restoreBuffer];
      this.restoreBuffer = null;
      // reflejar en el form control
      this.form.get('perfiles')!.setValue([...this.perfilesAgregados], { emitEvent: false });
      this.form.get('perfiles')!.updateValueAndValidity({ emitEvent: false });
    }
  }

  searchPerfil = (term: string, item: CatPerfilDto) =>
    (item.clave + ' ' + item.funcion).toLowerCase().includes((term || '').toLowerCase());
  onPerfilSelected(item: CatPerfilDto | null) {
    if (item) this.perfilPlaceholder = `${item.clave} - ${item.funcion}`;
    
  }

  // ---------- Avance con bloqueo si inválido ----------

  private scrollToFirstError() {
    const first = this.el.nativeElement.querySelector(
      '.ng-invalid[formcontrolname], .ng-invalid [formControlName]'
    ) as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  // ¿el seleccionado en ng-select ya está en la lista?
seleccionYaAgregada(): boolean {
  const sel = this.form.get('perfil')?.value;
  return !!sel && this.perfilesAgregados?.some(p => p.clave === sel.clave);
}

// Quita el perfil actualmente seleccionado en el ng-select
eliminarPerfilSeleccionado(): void {
  const sel = this.form.get('perfil')?.value;
  if (!sel) return;
  const idx = this.perfilesAgregados.findIndex(p => p.clave === sel.clave);
  if (idx >= 0) {
    this.eliminarPerfil(idx);       // ya tienes eliminarPerfil($index)
    this.form.get('perfil')?.reset();
  }
}

// validador: mínimo N elementos en un FormArray
private minLengthArray(min: number) {
  return (c: AbstractControl) => {
    const arr = c as FormArray;
    return arr && arr.length >= min ? null : { minLengthArray: { requiredLength: min, actualLength: arr?.length ?? 0 } };
  };
}
agregarPerfil(): void {
  const p = this.form.get('perfil')!.value as CatPerfilDto | null;
  if (!p) return;
  if (this.perfilesAgregados.some(x => x.id === p.id)) {
    this.form.patchValue({ perfil: null });
    return;
  }

  // UI
  this.perfilesAgregados = [...this.perfilesAgregados, p];

  // FormArray
  this.perfilesFA.push(this.fb.control(p, { nonNullable: true }));
  this.perfilesFA.markAsDirty();
  this.perfilesFA.markAsTouched();
  this.perfilesFA.updateValueAndValidity({ emitEvent: true });

  this.rebuildDisponibles();
  this.addPerfil.emit();

  // limpia selección del ng-select
  this.form.patchValue({ perfil: null });
}

eliminarPerfil(index: number): void {
  this.perfilesAgregados = this.perfilesAgregados.filter((_, i) => i !== index);

  this.perfilesFA.removeAt(index);
  this.perfilesFA.markAsDirty();
  this.perfilesFA.markAsTouched();
  this.perfilesFA.updateValueAndValidity({ emitEvent: true });

  this.rebuildDisponibles();
  this.removePerfil.emit(index);
}

get perfilesFA(): FormArray<FormControl<CatPerfilDto>> {
  return this.form.get('perfiles') as FormArray<FormControl<CatPerfilDto>>;
}
tryProceed(ev?: Event) {
  ev?.preventDefault();
  ev?.stopPropagation();

  this.triedSubmit = true;

  this.perfilesFA.updateValueAndValidity({ emitEvent: false }); // fuerza recálculo
  // opcional: sincroniza form por si el padre mira el .valid del grupo
  this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

  // DEBUG rápido si quieres ver qué pasa:
  // console.log('len=', this.perfilesFA.length, 'fa errors=', this.perfilesFA.errors, 'form.valid=', this.form.valid);

  if (this.perfilesFA.invalid) {
    this.scrollToFirstError();
    return;
  }

  // guarda solo lo que necesitas; getRawValue incluye el FormArray (como array de objetos)
  this.state.save(this.stepKey, this.form.getRawValue());
  this.next.emit();
}

}
