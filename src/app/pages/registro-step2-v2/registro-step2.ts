import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl,
  ValidationErrors, FormArray, FormControl
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrashAlt, faArrowLeft, faArrowRight, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { NgSelectModule } from '@ng-select/ng-select';

import { CatalogosService, CatPerfilDto } from '../../services/catalogos.service';
import { StepFormStateService } from '../../step-form/state/step-form-state.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-registro-step2',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FontAwesomeModule,
    HeaderSiauComponent, RegistroProgressComponent, NgSelectModule
  ],
  templateUrl: './registro-step2.html',
  styleUrls: ['./registro-step2.scss']
})
export class RegistroStep2Component implements OnInit, OnDestroy {
  // Progreso / encabezado
  @Input() currentStep = 2;
  @Input() maxSteps = 6;
  get totalSteps() { return this.maxSteps; } // alias para el template
  @Input() usuarioNombre = 'Luis Vargas';
  @Input() usuarioRol = 'Capturista';

  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<{ perfiles: CatPerfilDto[] }>();

  icPlus = faPlus;
  icTrash = faTrashAlt;
  icLeft = faArrowLeft;
  icRight = faArrowRight;
  icUser = faUserCircle;

  get progressPercent() {
    return Math.round((this.currentStep / (this.maxSteps || 1)) * 100);
  }

  // ===== Form y estado =====
  form!: FormGroup;
  triedSubmit = false;

  // Catálogo y listas
  perfiles: CatPerfilDto[] = [];            // catálogo completo (disponibles + no disponibles)
  perfilesDisponibles: CatPerfilDto[] = []; // catálogo filtrado (excluye agregados)
  perfilesAgregados: CatPerfilDto[] = [];   // selección del usuario

  private readonly stepKey = 'step2';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private catalogosService: CatalogosService,
    private state: StepFormStateService,
    private el: ElementRef<HTMLElement>
  ) {}

  // ======================
  // Ciclo de vida
  // ======================
  ngOnInit(): void {
    // Form local (idéntico al viejo en intención)
    this.form = this.fb.group({
      // id numérico del perfil seleccionado en el ng-select
      perfil: this.fb.control<number | null>(null),
      // arreglo de objetos CatPerfilDto
      perfiles: this.fb.array([], [this.minLengthArray(1)]),
    });

    // Restaurar si había guardado algo
    const prev = this.state.get(this.stepKey) as any;
    if (prev) {
      // restauro 'perfil' como id numérico
      const restoredId = prev?.perfil != null ? Number(prev.perfil) : null;
      this.form.patchValue({ perfil: restoredId }, { emitEvent: false });

      // restauro la lista agregada (objetos)
      if (Array.isArray(prev.perfiles) && prev.perfiles.length) {
        this.perfilesAgregados = prev.perfiles as CatPerfilDto[];
        this.setPerfilesFA(this.perfilesAgregados);
      }
    }

    // Persistencia mientras escribe
    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        const perfiles = this.perfilesFA.getRawValue(); // array de CatPerfilDto
        this.state.patchStep2({ perfiles }, /*persist*/ false);
      });

    // Cargar catálogo según estructura (Step1/Step2)
    this.loadPerfilesPorEstructura();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ======================
  // Helpers / FormArray
  // ======================
  get perfilesFA(): FormArray<FormControl<CatPerfilDto>> {
    return this.form.get('perfiles') as FormArray<FormControl<CatPerfilDto>>;
  }

  private setPerfilesFA(items: CatPerfilDto[]) {
    const fa = this.perfilesFA;
    while (fa.length) fa.removeAt(0);
    for (const it of items) fa.push(this.fb.control(it, { nonNullable: true }));
    fa.updateValueAndValidity({ emitEvent: false });
  }

  private minLengthArray(min: number) {
    return (c: AbstractControl) => {
      const arr = c as FormArray;
      return arr && arr.length >= min ? null : { minLengthArray: { requiredLength: min, actualLength: arr?.length ?? 0 } };
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

  private scrollToFirstError() {
    const first = this.el.nativeElement.querySelector(
      '.ng-invalid[formcontrolname], .ng-invalid [formControlName]'
    ) as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ======================
  // Select/búsqueda
  // ======================
  // normaliza strings para búsqueda
  private norm(s: any): string {
    return (s ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-–—]/g, ' ')
      .toLowerCase()
      .trim();
  }

  // función de búsqueda compatible con NgSelect
  searchPerfil = (term: string, item: CatPerfilDto): boolean => {
    const q = this.norm(term);
    if (!q) return true;
    const cadena = `${item?.clave ?? ''} - ${item?.funcion ?? ''}`;
    const haystack =
      `${this.norm(cadena)} ${this.norm(item?.clave)} ${this.norm(item?.funcion)} ${this.norm(item?.id)}`;
    const tokens = q.split(/\s+/);
    return tokens.every(t => haystack.includes(t))
        || haystack.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
  };

  // ======================
  // Catálogo / estructura
  // ======================
  private toIdOrNull(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private rebuildDisponibles(): void {
    const usados = new Set(this.perfilesAgregados.map(p => String(p.id)));
    this.perfilesDisponibles = (this.perfiles || []).filter(p => !usados.has(String(p.id)));
  }

  private loadPerfilesPorEstructura(): void {
    // Tomamos IDs desde el estado; preferimos step2 y caemos a step1
    const s2: any = this.state.get(this.stepKey);
    const s1: any = this.state.get('step1');

    const toNumOrNull = (x: any) => {
      const n = Number(x);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const ids = {
      institucionId: toNumOrNull(s2?.institucionId ?? s2?.institucion ?? s1?.institucion),
      dependenciaId: toNumOrNull(s2?.dependenciaId ?? s2?.dependencia ?? s1?.dependencia),
      // en Step1 usamos corporacion2 para la comisión; aquí respetamos fallback
      corporacionId: toNumOrNull(s2?.corporacionId ?? s2?.corporacion ?? s2?.corporacion2 ?? s1?.corporacion ?? s1?.corporacion2),
      areaId: toNumOrNull(s2?.areaId ?? s2?.area ?? s1?.area),
    };

    this.catalogosService.getPerfilesPorEstructuraAuto$(ids).subscribe({
      next: (list) => {
        this.perfiles = list || [];
        this.rebuildDisponibles();

        // Si había agregados, asegura que existan en el catálogo
        if (this.perfilesAgregados?.length) {
          const set = new Set(this.perfiles.map(p => String(p.id)));
          const filtrados = this.perfilesAgregados.filter(p => set.has(String(p.id)));
          if (filtrados.length !== this.perfilesAgregados.length) {
            this.perfilesAgregados = filtrados;
            this.setPerfilesFA(filtrados);
            this.rebuildDisponibles();
          }
        }
      },
      error: (err) => {
        console.error('Perfiles por estructura:', err);
        this.perfiles = [];
        this.rebuildDisponibles();
      }
    });
  }

  // ======================
  // UI / acciones
  // ======================
  get selectedPerfilId(): number | null {
    return this.toIdOrNull(this.form.get('perfil')?.value);
  }

  get canAgregar(): boolean {
    return this.selectedPerfilId != null;
  }

  get canQuitar(): boolean {
    const idSel = this.selectedPerfilId;
    return idSel != null && this.perfilesAgregados.some(p => Number(p.id) === idSel);
  }

  onNgSelectChange(val: any) {
    // NgSelect emite id o objeto; normalizamos a id numérico
    const id = this.toIdOrNull(typeof val === 'object' ? val?.id : val);
    this.form.get('perfil')!.setValue(id, { emitEvent: true });
  }

  agregarPerfil(): void {
    const idSel = this.selectedPerfilId;
    if (idSel == null) return;

    if (this.perfilesAgregados.some(p => Number(p.id) === idSel)) {
      this.form.get('perfil')?.reset();
      return;
    }

    const p = this.perfiles.find(x => Number(x.id) === idSel);
    if (!p) return;

    this.perfilesAgregados = [...this.perfilesAgregados, p];

    this.perfilesFA.push(this.fb.control(p, { nonNullable: true }));
    this.perfilesFA.markAsDirty();
    this.perfilesFA.markAsTouched();
    this.perfilesFA.updateValueAndValidity({ emitEvent: true });

    // Limpia selección y reconstruye disponibles
    this.form.get('perfil')?.reset();
    this.rebuildDisponibles();
  }

  onQuitarClick(ev: Event) {
    ev.preventDefault(); ev.stopPropagation();

    if (!this.perfilesAgregados.length) return;

    const idSel = this.selectedPerfilId;
    let idx = -1;
    if (idSel != null) idx = this.perfilesAgregados.findIndex(p => Number(p.id) === idSel);
    if (idx === -1) idx = this.perfilesAgregados.length - 1;

    this.eliminarPerfil(idx);
    this.form.get('perfil')?.reset();
    this.rebuildDisponibles();
  }

  eliminarPerfil(index: number): void {
    if (index < 0 || index >= this.perfilesAgregados.length) return;

    this.perfilesAgregados = this.perfilesAgregados.filter((_, i) => i !== index);

    this.perfilesFA.removeAt(index);
    this.perfilesFA.markAsDirty();
    this.perfilesFA.markAsTouched();
    this.perfilesFA.updateValueAndValidity({ emitEvent: true });

    this.rebuildDisponibles();
  }

  tryProceed(ev?: Event) {
    ev?.preventDefault(); ev?.stopPropagation();
    this.triedSubmit = true;

    this.perfilesFA.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    if (this.perfilesFA.invalid) {
      this.scrollToFirstError();
      return;
    }

    // Persistimos y emitimos
    this.state.save(this.stepKey, this.form.getRawValue());
    this.proceed.emit({ perfiles: this.perfilesFA.getRawValue() });
  }
}
