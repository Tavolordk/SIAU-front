import { Component, Input, Output, EventEmitter, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  curpValidator,
  rfcValidator,
  notOnlyWhitespaceValidator,
} from '../../shared/validators';
import { StepFormStateService } from '../state/step-form-state.service';
import { CatalogosService, CatalogoItem } from '../../services/catalogos.service';
type NodoEstructura = { id: number; nombre: string; tipo: string; fK_PADRE: number | null };

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step1.html',
  styleUrls: ['./step1.scss']
})
export class Step1Component implements OnInit, OnDestroy {
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<void>();

  @Input() form!: FormGroup;
  @Input() tipos: string[] = [];
  private estructura: NodoEstructura[] = [];

  // Catálogos
  sexos: CatalogoItem[] = [];
  estadosCiviles: CatalogoItem[] = [];
  nacionalidades: CatalogoItem[] = [];
  ambitos: CatalogoItem[] = [];
  entidades: CatalogoItem[] = [];
  tipoDeUsuario: CatalogoItem[] = [];
  paises: CatalogoItem[] = [];
  areas: CatalogoItem[] = [];
  NO_APLICA: CatalogoItem = { id: 0, nombre: 'NO APLICA' };

  // Cascadas
  municipiosNacimiento: CatalogoItem[] = [];
  municipiosAdscripcion: CatalogoItem[] = [];
  instituciones: CatalogoItem[] = [];
  dependencias: CatalogoItem[] = [];
  corporaciones: CatalogoItem[] = [];

  instituciones2: CatalogoItem[] = [];
  dependencias2: CatalogoItem[] = [];
  corporaciones2: CatalogoItem[] = [];
  municipiosComision: CatalogoItem[] = [];

  triedSubmit = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private el: ElementRef<HTMLElement>,
    private state: StepFormStateService,
    private catalogos: CatalogosService
  ) { }

  ngOnInit(): void {
    // ----- form -----
    this.form = this.fb.group({
      tipoUsuario: [null, Validators.required],
      esSeguridad: [null, Validators.required],
      curp: ['', [Validators.required, Validators.maxLength(18), curpValidator()]],
      captcha: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      primerApellido: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      segundoApellido: [''],

      sexo: [null, Validators.required],
      fechaNacimiento: ['', [Validators.required, this.dateDMYValidator]],

      // 👇 ahora IDs de catálogo
      nacionalidad: [null, Validators.required],

      // Puedes seguir dejando país libre o convertirlo a select de cat_pais si quieres
      paisNacimiento: [null, Validators.required],
      area: [null],
      // 👇 ahora IDs de catálogo
      entidadNacimiento: [null, Validators.required],
      municipioAlcaldia: [null, Validators.required],

      estadoCivil: [null], // ahora ID (deja sin required si negocio lo permite)
      rfc: ['', [Validators.required, Validators.maxLength(13), rfcValidator()]],
      cuip: [''],

      // Adscripción actual
      tipoInstitucion: [null, Validators.required], // Ámbito
      entidad: [null, Validators.required],
      municipioAlcaldia2: [null, Validators.required],
      institucion: [null, Validators.required],
      dependencia: [null],
      corporacion: [null],
      fechaIngreso: ['', [Validators.required, this.dateDMYValidator]],
      cargo: [''],
      funciones: [''],
      numeroEmpleado: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      comisionado: [null, Validators.required], // "Si" | "No"

      // Comisión
      tipoInstitucion2: [null],
      entidad2: [null],
      municipioAlcaldia3: [null],
      institucion2: [null],
      dependencia2: [null],
      corporacion2: [null],

      aceptaTerminos: [false, Validators.requiredTrue],
    });

    // Reglas dinámicas (comisión)
    this.form.get('comisionado')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        const req = v === 'Si' ? [Validators.required] : [];
        ['tipoInstitucion2', 'entidad2', 'municipioAlcaldia3', 'institucion2'].forEach(cn => {
          const c = this.form.get(cn)!;
          c.setValidators(req);
          c.updateValueAndValidity({ emitEvent: false });
        });
      });

    // Persistencia
    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => this.state.save('step1', v, /*persist*/ false));

    const prev = this.state.get('step1');
    if (prev) this.form.patchValue(prev, { emitEvent: false });

    // ----- cargar catálogos base (desde CatalogosService) -----
    this.catalogos
    this.catalogos.getSexos$().pipe(takeUntil(this.destroy$)).subscribe(v => this.sexos = v);
    this.catalogos.getEstadosCiviles$().pipe(takeUntil(this.destroy$)).subscribe(v => this.estadosCiviles = v);
    this.catalogos.getNacionalidades$().pipe(takeUntil(this.destroy$)).subscribe(v => this.nacionalidades = v);
    this.catalogos.getAmbito$().pipe(takeUntil(this.destroy$)).subscribe(v => this.ambitos = v);
    this.catalogos.getTiposUsuario$().subscribe(v => this.tipoDeUsuario = v);

this.catalogos.getAll().pipe(takeUntil(this.destroy$)).subscribe(res => {
  this.estructura = (res?.Estructura || []).map((e: any) => ({
    id: Number(e.id ?? e.ID),
    nombre: String(e.nombre ?? e.NOMBRE).trim(),
    tipo: String(e.tipo ?? e.TIPO).toLowerCase().trim(),
    fK_PADRE: (e.fK_PADRE ?? e.FK_PADRE) == null ? null : Number(e.fK_PADRE ?? e.FK_PADRE),
  }));

  // instituciones raíz (padre null)
  this.instituciones = this.estructura
    .filter(n => n.tipo === 'institucion' && n.fK_PADRE == null)
    .map(n => ({ id: n.id, nombre: n.nombre }));

  // Entidades (si las traes en ese payload)
  this.entidades = (res?.Entidades || [])
    .filter((e: any) => (e.tipo ?? '').toString().toUpperCase() === 'ESTADO')
    .map((e: any) => ({ id: Number(e.id), nombre: String(e.nombre) }));
});


    // ----- encadenamientos -----

    // Nacimiento: entidadNacimiento -> municipioAlcaldia
    this.form.get('entidadNacimiento')!.valueChanges
      .pipe(
        startWith(this.form.get('entidadNacimiento')!.value),
        switchMap((entId: number | null) => {
          this.resetControl('municipioAlcaldia');
          if (!entId) return of<CatalogoItem[]>([]);
          return this.catalogos.getMunicipios(entId);
        }),
        takeUntil(this.destroy$)
      ).subscribe(list => {
        this.municipiosNacimiento = list;
        this.validateInList('municipioAlcaldia', list);
      });

    // Adscripción: entidad -> municipioAlcaldia2
    this.form.get('entidad')!.valueChanges
      .pipe(
        startWith(this.form.get('entidad')!.value),
        switchMap((entId: number | null) => {
          this.resetControl('municipioAlcaldia2');
          if (!entId) return of<CatalogoItem[]>([]);
          return this.catalogos.getMunicipios(entId);
        }),
        takeUntil(this.destroy$)
      ).subscribe(list => {
        this.municipiosAdscripcion = list;
        this.validateInList('municipioAlcaldia2', list);
      });

    // Adscripción: ámbito (tipoInstitucion) -> instituciones
    // Adscripción: ámbito (tipoInstitucion) -> instituciones
    this.form.get('tipoInstitucion')!.valueChanges
      .pipe(
        startWith(this.form.get('tipoInstitucion')!.value),
        tap(() => this.resetControls(['institucion', 'dependencia', 'corporacion', 'area'])),
        switchMap(() => this.catalogos.getInstituciones$ ? this.catalogos.getInstituciones$() : of(this.catalogos.instituciones)),
        takeUntil(this.destroy$)
      )
      .subscribe(list => this.instituciones = list);

    // institucion -> dependencias (con reset de corporación y área)
this.form.get('institucion')!.valueChanges
  .pipe(startWith(this.form.get('institucion')!.value), takeUntil(this.destroy$))
  .subscribe(v => this.cargarDependenciasLocal(v));
    // dependencia -> corporaciones
    // dependencia -> corporaciones (con fallback y manejo de 0)
this.form.get('dependencia')!.valueChanges
  .pipe(startWith(this.form.get('dependencia')!.value), takeUntil(this.destroy$))
  .subscribe(v => this.cargarCorporacionesLocal(v));
    // Corporación -> Áreas (con fallback y manejo de 0)
this.form.get('corporacion')!.valueChanges
  .pipe(startWith(this.form.get('corporacion')!.value), takeUntil(this.destroy$))
  .subscribe(v => this.cargarAreasLocal(v));



    // Comisión: entidad2 -> municipioAlcaldia3
    this.form.get('entidad2')!.valueChanges
      .pipe(
        startWith(this.form.get('entidad2')!.value),
        switchMap((entId: number | null) => {
          this.resetControl('municipioAlcaldia3');
          if (!entId) return of<CatalogoItem[]>([]);
          return this.catalogos.getMunicipios(entId);
        }),
        takeUntil(this.destroy$)
      ).subscribe(list => {
        this.municipiosComision = list;
        this.validateInList('municipioAlcaldia3', list);
      });

    // Comisión: ámbito2 -> instituciones2
    this.form.get('tipoInstitucion2')!.valueChanges
      .pipe(
        startWith(this.form.get('tipoInstitucion2')!.value),
        tap(() => this.resetControls(['institucion2', 'dependencia2', 'corporacion2'])),
        switchMap(() => {
          return this.catalogos.getInstituciones$ ? this.catalogos.getInstituciones$() : of(this.catalogos.instituciones);
        }),
        takeUntil(this.destroy$)
      ).subscribe(list => this.instituciones2 = list);

    this.form.get('institucion2')!.valueChanges
      .pipe(
        startWith(this.form.get('institucion2')!.value as number | null),
        tap(() => this.resetControls(['dependencia2', 'corporacion2'])),
        switchMap((instId: number | null) =>
          instId ? this.catalogos.getDependencias$(instId) : of<CatalogoItem[]>([])
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(list => {
        this.dependencias2 = list;
        this.validateInList('dependencia2', list);
      });

    // Comisión: dependencia2 -> corporacion2
    this.form.get('dependencia2')!.valueChanges
      .pipe(
        startWith(this.form.get('dependencia2')!.value as number | null),
        tap(() => this.resetControls(['corporacion2'])),
        switchMap((depId: number | null) =>
          depId ? this.catalogos.getCorporaciones$(depId) : of<CatalogoItem[]>([])
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(list => {
        this.corporaciones2 = list;
        this.validateInList('corporacion2', list);
      });

    // Países
    this.catalogos.getPaises$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.paises = list;
        this.validateInList('paisNacimiento', list);
      });



  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ------- UX helpers -------
  submit() { this.tryProceed(); }

  invalid(ctrl: string) {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.touched || c.dirty || this.triedSubmit);
  }
  hasError(ctrl: string, code: string) {
    const c = this.form.get(ctrl);
    return !!c && c.hasError(code) && (c.touched || c.dirty || this.triedSubmit);
  }

  tryProceed(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.triedSubmit = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    if (this.form.invalid) {
      this.scrollToFirstError();
      return;
    }

    this.state.save('step1', this.form.getRawValue());
    this.next.emit();
  }

  private scrollToFirstError() {
    const first = this.el.nativeElement.querySelector(
      '.ng-invalid[formcontrolname], .ng-invalid [formControlName]'
    ) as HTMLElement | null;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private dateDMYValidator = (c: AbstractControl) => {
    const v = (c.value ?? '').toString().trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return { dateFormat: true };
    const [dd, mm, yyyy] = v.split('/').map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    const ok = d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
    return ok ? null : { dateInvalid: true };
  };

  private resetControl(name: string) {
    const c = this.form.get(name)!;
    c.reset(null, { emitEvent: false });
    c.setErrors(null);
  }
  private resetControls(names: string[]) { names.forEach(n => this.resetControl(n)); }

  /** Marca invalidOption si el valor no está en la lista (útil cuando restauras estado) */
  private validateInList(ctrlName: string, options: CatalogoItem[]) {
    const ctrl = this.form.get(ctrlName);
    if (!ctrl) return;
    const val = ctrl.value;
    if (val == null || val === '') { ctrl.setErrors(null); return; }
    const ok = options?.some(o => String(o.id) === String(val));
    if (!ok) {
      ctrl.setErrors({ ...(ctrl.errors ?? {}), invalidOption: true });
    } else {
      const { invalidOption, ...rest } = ctrl.errors ?? {};
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  // para *ngFor trackBy
  trackById = (_: number, it: CatalogoItem) => it.id;

  private cargarDependenciasLocal(parentId: number | null) {
  const pid = parentId == null ? null : Number(parentId);

  if (pid == null) {
    this.dependencias = [];
    this.form.get('dependencia')!.setValue(null, { emitEvent: false });
    this.corporaciones = [];
    this.form.get('corporacion')!.setValue(null, { emitEvent: false });
    this.areas = [];
    this.form.get('area')!.setValue(null, { emitEvent: false });
    return;
  }

  const items = this.estructura
    .filter(x => x.tipo === 'dependencia' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.dependencias = items.length ? items : [this.NO_APLICA];
  this.form.get('dependencia')!.setValue(this.dependencias[0].id, { emitEvent: true });
}

private cargarCorporacionesLocal(parentId: number | null) {
  const pid = parentId == null ? null : Number(parentId);

  if (pid == null) {
    this.corporaciones = [];
    this.form.get('corporacion')!.setValue(null, { emitEvent: false });
    this.areas = [];
    this.form.get('area')!.setValue(null, { emitEvent: false });
    return;
  }
  if (pid === 0) { // NO APLICA → propaga
    this.corporaciones = [this.NO_APLICA];
    this.form.get('corporacion')!.setValue(0, { emitEvent: true });
    return;
  }

  const items = this.estructura
    .filter(x => x.tipo === 'corporacion' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.corporaciones = items.length ? items : [this.NO_APLICA];
  this.form.get('corporacion')!.setValue(this.corporaciones[0].id, { emitEvent: true });
}

private cargarAreasLocal(parentId: number | null) {
  const pid = parentId == null ? null : Number(parentId);

  if (pid == null) {
    this.areas = [];
    this.form.get('area')!.setValue(null, { emitEvent: false });
    return;
  }
  if (pid === 0) { // NO APLICA → propaga
    this.areas = [this.NO_APLICA];
    this.form.get('area')!.setValue(0, { emitEvent: false });
    return;
  }

  const items = this.estructura
    .filter(x => x.tipo === 'area' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.areas = items.length ? items : [this.NO_APLICA];
  this.form.get('area')!.setValue(this.areas[0].id, { emitEvent: false });
}

}
