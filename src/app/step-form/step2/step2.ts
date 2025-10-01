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

  @Output() addPerfil = new EventEmitter<void>();
  @Output() removePerfil = new EventEmitter<number>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  // Catálogo y listas
  @Input() perfiles: CatPerfilDto[] = [];
  perfilesDisponibles: CatPerfilDto[] = [];
  perfilesAgregados: CatPerfilDto[] = [];

  // UI
  perfilPlaceholder = '';
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
  ) { }

  ngOnInit(): void {
    // Construye el form si no viene del padre
    // en ngOnInit:
    if (!this.form) {
      this.form = this.fb.group({
        perfil: this.fb.control<number | null>(null),   // <- id numérico
        perfiles: this.fb.array([], [this.minLengthArray(1)])
      });

    } else {
      if (!this.form.get('perfil')) {
        this.form.addControl('perfil', this.fb.control<number | null>(null)); // <- id numérico
      }

      if (!(this.form.get('perfiles') instanceof FormArray)) {
        this.form.removeControl('perfiles');
        this.form.addControl('perfiles', this.fb.array([], [this.minLengthArray(1)]));
      }
    }


    // Persistencia mientras escribe (opcional)
    // Step2Component.ngOnInit()
    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        const perfiles = this.perfilesFA.getRawValue(); // array de CatPerfilDto
        this.state.patchStep2({ perfiles }, /*persist*/ false);
      });


    // Restaurar si había guardado algo
    const prev = this.state.get(this.stepKey) as any;
    if (prev) {
      const raw = prev?.perfil && typeof prev.perfil === 'object' ? prev.perfil.id : prev.perfil;
      const restoredId = raw != null ? Number(raw) : null;       // <- número
      this.form.patchValue({ perfil: restoredId }, { emitEvent: false });

      if (Array.isArray(prev.perfiles) && prev.perfiles.length) {
        this.perfilesAgregados = prev.perfiles as CatPerfilDto[]; // <- objetos tal cual
        this.setPerfilesFA(this.perfilesAgregados);
      }
    }
    // Cargar catálogo
    // Cargar catálogo (filtrado por el id más específico ≠ 0)
    this.loadPerfilesPorEstructura();


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

  // ---------- Avance con bloqueo si inválido ----------

  private scrollToFirstError() {
    const first = this.el.nativeElement.querySelector(
      '.ng-invalid[formcontrolname], .ng-invalid [formControlName]'
    ) as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // validador: mínimo N elementos en un FormArray
  private minLengthArray(min: number) {
    return (c: AbstractControl) => {
      const arr = c as FormArray;
      return arr && arr.length >= min ? null : { minLengthArray: { requiredLength: min, actualLength: arr?.length ?? 0 } };
    };
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
  estaAgregado = (item: CatPerfilDto) =>
    !!item && this.perfilesAgregados.some(p => p.id === item.id);

  seleccionYaAgregada(): boolean {
    const sel = this.form.get('perfil')?.value as CatPerfilDto | null;
    return !!sel && this.estaAgregado(sel);
  }

  // 5) Si antes filtrabas "disponibles", ya no hace falta.
  // Si te queda algún llamado, déjalo idempotente:
  private rebuildDisponibles(): void {
    const usados = new Set(this.perfilesAgregados.map(p => String(p.id)));
    this.perfilesDisponibles = (this.perfiles || []).filter(p => !usados.has(String(p.id)));
  }

  eliminarPerfilSeleccionado(): void {
    const idSel = this.selectedPerfilId;
    if (idSel == null) return;
    const idx = this.perfilesAgregados.findIndex(p => this.sameId(p.id, idSel));
    if (idx >= 0) {
      this.eliminarPerfil(idx);
      this.form.get('perfil')?.reset();
    }
  }
  // normaliza para evitar '12' vs 12
  private sameId = (a: number | string, b: number | string) => String(a) === String(b);

  eliminarPerfil(index: number): void {
    const victima = this.perfilesAgregados[index];
    console.log('[EliminarPerfil] index=', index, 'victima=', victima);

    // Puedes usar splice para mutar y luego “forzar” CD si lo prefieres:
    // this.perfilesAgregados.splice(index, 1);
    // this.perfilesAgregados = [...this.perfilesAgregados];

    this.perfilesAgregados = this.perfilesAgregados.filter((_, i) => i !== index);

    // FormArray
    this.perfilesFA.removeAt(index);
    this.perfilesFA.markAsDirty();
    this.perfilesFA.markAsTouched();
    this.perfilesFA.updateValueAndValidity({ emitEvent: true });

    console.log('[EliminarPerfil] restantes.ids=', this.perfilesAgregados.map(p => p.id),
      'FA.length=', this.perfilesFA.length);

    this.rebuildDisponibles();
    this.removePerfil.emit(index);
  }

  lastSelectedId: number | null = null;

  ngAfterViewInit() {
    this.form.get('perfil')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        const n = this.toIdOrNull(v);
        if (n != null) this.lastSelectedId = n;
      });
  }

  /** Convierte a número válido (>0) o null si viene '', null, undefined o NaN */
  private toIdOrNull(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /** Usa el valor del control; si está vacío, recurre al último válido */
  get selectedPerfilId(): number | null {
    const v = this.form.get('perfil')?.value;
    return this.toIdOrNull(v) ?? this.lastSelectedId ?? null;
  }

  onNgSelectChange(val: any) {
    const id = this.toIdOrNull(typeof val === 'object' ? val?.id : val);
    this.form.get('perfil')!.setValue(id, { emitEvent: true });
  }

  estaAgregadoId = (id: number | null) =>
    id != null && this.perfilesAgregados.some(p => Number(p.id) === id);
  get canQuitar(): boolean {
    const id = this.selectedPerfilId;
    return id != null && this.estaAgregadoId(id);
  }

  get canAgregar(): boolean {
    // con items filtrados, es suficiente con que haya selección
    return this.selectedPerfilId != null;
  }
  onQuitarClick(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    if (this.perfilesAgregados.length === 0) return;

    const idSel = this.selectedPerfilId;

    // si hay seleccionado, quitamos ese; si no, hacemos pop (último)
    let idx = -1;
    if (idSel != null) {
      idx = this.perfilesAgregados.findIndex(p => Number(p.id) === idSel);
    }
    if (idx === -1) idx = this.perfilesAgregados.length - 1;

    this.eliminarPerfil(idx);

    // limpia selección porque ese id ya no estará en items
    this.form.get('perfil')?.reset();

    // reconstruye items para que el perfil regresado reaparezca
    this.rebuildDisponibles();
  }

  agregarPerfil(): void {
    const idSel = this.selectedPerfilId;
    if (idSel == null) return;

    // ya no hace falta checar estaAgregadoId porque la lista viene filtrada,
    // pero lo dejamos por seguridad:
    if (this.estaAgregadoId(idSel)) { this.form.get('perfil')?.reset(); return; }

    const p = this.perfiles.find(x => Number(x.id) === idSel);
    if (!p) return;

    this.perfilesAgregados = [...this.perfilesAgregados, p];
    this.perfilesFA.push(this.fb.control(p, { nonNullable: true }));
    this.perfilesFA.markAsDirty();
    this.perfilesFA.markAsTouched();
    this.perfilesFA.updateValueAndValidity({ emitEvent: true });

    this.addPerfil.emit();

    // Limpia selección y actualiza items del select
    this.form.get('perfil')?.reset();
    this.rebuildDisponibles();
  }
  /** Carga perfiles desde el MS de Solicitudes escogiendo el id más específico ≠ 0 */
  private loadPerfilesPorEstructura(): void {
    // 1) Tomamos IDs desde el estado de Step2; si no están, caemos a Step1
    const s2: any = this.state.get(this.stepKey);
    const s1: any = this.state.get('step1');

    // elegimos la fuente que tenga algo
    const hasIds = (x: any) =>
      this.toIdOrNull(x?.areaId ?? x?.area) ||
      this.toIdOrNull(x?.corporacionId ?? x?.corporacion ?? x?.corporacion2) ||
      this.toIdOrNull(x?.dependenciaId ?? x?.dependencia) ||
      this.toIdOrNull(x?.institucionId ?? x?.institucion);

    const src = hasIds(s2) ? s2 : s1;

    // 2) Normalizamos posibles nombres de campos entre steps
    const ids = {
      institucionId: this.toIdOrNull(src?.institucionId ?? src?.institucion),
      dependenciaId: this.toIdOrNull(src?.dependenciaId ?? src?.dependencia),
      corporacionId: this.toIdOrNull(src?.corporacionId ?? src?.corporacion ?? src?.corporacion2),
      areaId: this.toIdOrNull(src?.areaId ?? src?.area),
    };

    // 3) Llamada al service: él decide cuál ID enviar (area>corp>dep>inst), o ninguno → todos
    this.catalogosService.getPerfilesPorEstructuraAuto$(ids).subscribe({
      next: (list) => {
        this.perfiles = list;
        this.rebuildDisponibles();

        // Si restauraste perfiles guardados, asegúrate de que sigan existiendo en el nuevo catálogo
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

private norm(s: any): string {
  return (s ?? '')
    .toString()
    .normalize('NFD')                 // quita acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-–—]/g, ' ')          // ignora guiones
    .toLowerCase()
    .trim();
}

searchPerfil = (term: string, item: CatPerfilDto): boolean => {
  const q = this.norm(term);
  if (!q) return true;

  const cadena = `${item?.clave ?? ''} - ${item?.funcion ?? ''}`;
  const haystack =
    `${this.norm(cadena)} ${this.norm(item?.clave)} ${this.norm(item?.funcion)} ${this.norm(item?.id)}`;

  // match por tokens: cada palabra del query debe aparecer
  const tokens = q.split(/\s+/);
  return tokens.every(t => haystack.includes(t))
      || haystack.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')); // “CT01” ~ “CT 01”
};


}
