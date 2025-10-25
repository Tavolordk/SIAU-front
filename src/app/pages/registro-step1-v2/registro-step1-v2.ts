// src/app/pages/registro-step1-v2/registro-step1-v2.ts
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators,
  AbstractControl, AsyncValidatorFn, ValidationErrors
} from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, startWith, switchMap, takeUntil, tap, map, catchError } from 'rxjs/operators';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserCircle, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons';

import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { CaptchaBoxComponent } from '../../shared/captcha-box/captcha-box.component';

import { CatalogosService, CatalogoItem } from '../../services/catalogos.service';
import { CaptchaApi } from '../../core/captcha/captcha.api';

import { curpValidator, rfcValidator, notOnlyWhitespaceValidator } from '../../shared/validators';
import { afterOrEqualControl, dateISOValidator, maxDate, minDate } from '../../shared/validators/date';

type Step2State = {
  entidad: number | null;
  municipio: number | null;
  area: number | null;
  entidad2: number | null;
  municipio2: number | null;
  corporacion2: number | null;
};

type NodoEstructura = { id: number; nombre: string; tipo: string; fK_PADRE: number | null };

@Component({
  selector: 'app-registro-step1-v2',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FontAwesomeModule,
    HeaderSiauComponent, RegistroProgressComponent, CaptchaBoxComponent
  ],
  templateUrl: './registro-step1-v2.html',
  styleUrls: ['./registro-step1-v2.scss']
})
export class RegistroStep1V2Component implements OnInit, OnDestroy {
  // UI
  icUser = faUserCircle; icLeft = faArrowLeft; icRight = faArrowRight; icCalendar = faCalendarAlt;

  @Input() currentStep = 1;
  @Input() maxSteps = 6;
  @Input() usuarioNombre = 'Octavio Olea';
  @Input() usuarioRol = 'Administrador';

  @Output() prev = new EventEmitter<void>();
  // Emitimos snapshot útil al contenedor (opcional para tu modelo)
  @Output() proceed = new EventEmitter<{ step1: any; step2: Step2State }>();

  form!: FormGroup;
  todayISO = new Date().toISOString().slice(0, 10);
totalSteps: number|undefined;
  get minFechaIngreso(): string {
    const n = this.form?.get('fechaNacimiento')?.value;
    return (n && /^\d{4}-\d{2}-\d{2}$/.test(n)) ? n : '1900-01-01';
  }

  // Catálogos y listas locales (NO vienen del padre)
  sexos: CatalogoItem[] = [];
  estadosCiviles: CatalogoItem[] = [];
  nacionalidades: CatalogoItem[] = [];
  ambitos: CatalogoItem[] = [];
  entidades: CatalogoItem[] = [];
  tipoDeUsuario: CatalogoItem[] = [];
  paises: CatalogoItem[] = [];
  municipiosNacimiento: CatalogoItem[] = [];
  municipiosAdscripcion: CatalogoItem[] = [];
  instituciones: CatalogoItem[] = [];
  dependencias: CatalogoItem[] = [];
  corporaciones: CatalogoItem[] = [];
  areas: CatalogoItem[] = [];
  instituciones2: CatalogoItem[] = [];
  dependencias2: CatalogoItem[] = [];
  corporaciones2: CatalogoItem[] = [];
  municipiosComision: CatalogoItem[] = [];

  private estructura: NodoEstructura[] = [];
  NO_APLICA: CatalogoItem = { id: 0, nombre: 'NO APLICA' };

  private destroy$ = new Subject<void>();

  // Captcha
  private captchaId?: string;
  private captchaAnswer = '';

  constructor(
    private fb: FormBuilder,
    private catalogos: CatalogosService,
    private captcha: CaptchaApi,
  ) {}

  // ===== Init =====
  ngOnInit(): void {
    // Form del Paso 1 (idéntico al viejo, renombrando controles como estaban)
    this.form = this.fb.group({
      hp: [''],
      tipoUsuario: [null],
      esSeguridad: [null],
      curp: ['', [Validators.required, Validators.maxLength(18), curpValidator()]],
      captchaCode: ['', {
        validators: [Validators.required, Validators.pattern(/^\d{5}$/)],
        asyncValidators: [this.captchaCorrectAsyncValidator()],
        updateOn: 'change'
      }],

      nombre: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      primerApellido: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      segundoApellido: [''],

      sexo: [null],
      fechaNacimiento: ['', [Validators.required, dateISOValidator(), minDate('1900-01-01'), maxDate(this.todayISO)]],

      nacionalidad: [null],
      paisNacimiento: [null],
      entidadNacimiento: [null],
      municipioAlcaldia: [null], // municipio nacimiento

      estadoCivil: [null],
      rfc: ['', [Validators.required, Validators.maxLength(13), rfcValidator()]],
      cuip: [''],

      tipoInstitucion: [null],
      entidad: [null],
      municipioAlcaldia2: [null],
      institucion: [null],
      dependencia: [null],
      corporacion: [null],
      area: [null],
      fechaIngreso: ['', [Validators.required, dateISOValidator(), minDate('1900-01-01'),
        maxDate(this.todayISO), afterOrEqualControl('fechaNacimiento')]],
      cargo: [''],
      funciones: [''],
      numeroEmpleado: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      comisionado: [null], // "Si" | "No"

      // Comisión
      tipoInstitucion2: [null],
      entidad2: [null],
      municipioAlcaldia3: [null],
      institucion2: [null],
      dependencia2: [null],
      corporacion2: [null],

      aceptaTerminos: [null],
    });

    // encendidos dinámicos
    this.form.get('comisionado')!.valueChanges
      .pipe(startWith(this.form.get('comisionado')!.value), takeUntil(this.destroy$))
      .subscribe(v => this.applyCommissionState(v === 'Si'));

    // Catálogos base y estructura
    this.loadCatalogos();

    // Encadenamientos (nacimiento/adscripción/comisión)
    this.setupCascadas();

    // Revalida ingreso cuando cambia nacimiento
    this.form.get('fechaNacimiento')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.form.get('fechaIngreso')!.updateValueAndValidity({ emitEvent: false }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Captcha =====
  onCaptchaChange(e: { id?: string; answer: string }) {
    this.captchaId = e.id;
    this.captchaAnswer = e.answer;
    this.form.get('captchaCode')?.setValue(this.captchaAnswer);
    this.form.get('captchaCode')?.markAsTouched();
  }
  onCaptchaRefreshed(newId: string) {
    this.captchaId = newId;
    this.form.get('captchaCode')?.reset('', { emitEvent: true });
  }
  private captchaCorrectAsyncValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl) => {
      const answer = (ctrl.value ?? '').toString().trim();
      const id = this.captchaId;
      if (!id || !/^\d{6}$/.test(answer)) return of(null);
      return this.captcha.verify(id, answer).pipe(
        map(res => (res?.ok && !!res?.token) ? null : { captchaInvalid: true }),
        catchError(() => of<ValidationErrors>({ captchaError: true }))
      );
    };
  }

  onVerifyCurp() {
    if (this.form.value.hp) return; // honeypot
    const curpCtrl = this.form.get('curp');
    curpCtrl?.markAsTouched();
    if (curpCtrl?.invalid) return;

    if (!this.captchaId || !this.captchaAnswer) {
      alert('Resuelve el captcha antes de verificar la CURP.');
      return;
    }
    this.captcha.verify(this.captchaId, this.captchaAnswer).subscribe({
      next: res => {
        if (!res.ok || !res.token) {
          alert('Código de verificación incorrecto o expirado.');
          return;
        }
        // Si luego conectas RENAPO, hazlo aquí.
        alert('CURP y captcha válidos.');
      },
      error: _ => alert('No se pudo verificar el captcha. Intenta de nuevo.')
    });
  }

  // ===== Submit / Proceed =====
  tryProceed(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    if (this.form.value.hp) return;

    // Ignora captchaCode si ya hay token interno (CaptchaApi)
    const hasToken = !!this.captcha.getToken();
    if (!hasToken) {
      const c = this.form.get('captchaCode');
      if (!(c && c.valid)) {
        alert('Resuelve el captcha antes de continuar.');
        this.scrollToFirstError();
        return;
      }
    }

    if (this.invalidWithoutCaptcha()) {
      this.scrollToFirstError();
      return;
    }

    const v = this.form.getRawValue();
    const step1 = this.mapFormToStep1(v);
    const step2 = this.buildStep2Snapshot();

    this.proceed.emit({ step1, step2 });
  }

  // ===== Catálogos / cascadas =====
  private loadCatalogos(): void {
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

      // Entidades (si vienen en payload)
      this.entidades = (res?.Entidades || [])
        .filter((e: any) => (e.tipo ?? '').toString().toUpperCase() === 'ESTADO')
        .map((e: any) => ({ id: Number(e.id), nombre: String(e.nombre) }));
    });

    this.catalogos.getPaises$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.paises = list;
        this.validateInList('paisNacimiento', list);
      });
  }

  private setupCascadas(): void {
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

    // Adscripción: ámbito -> instituciones
    this.form.get('tipoInstitucion')!.valueChanges
      .pipe(
        startWith(this.form.get('tipoInstitucion')!.value),
        tap(() => this.resetControls(['institucion', 'dependencia', 'corporacion', 'area'])),
        switchMap(() => this.catalogos.getInstituciones$ ? this.catalogos.getInstituciones$() : of(this.catalogos.instituciones)),
        takeUntil(this.destroy$)
      ).subscribe(list => this.instituciones = list);

    // institucion -> dependencias
    this.form.get('institucion')!.valueChanges
      .pipe(startWith(this.form.get('institucion')!.value), takeUntil(this.destroy$))
      .subscribe(v => this.cargarDependenciasLocal(v));

    // dependencia -> corporaciones
    this.form.get('dependencia')!.valueChanges
      .pipe(startWith(this.form.get('dependencia')!.value), takeUntil(this.destroy$))
      .subscribe(v => this.cargarCorporacionesLocal(v));

    // corporacion -> áreas
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
        switchMap(() => this.catalogos.getInstituciones$ ? this.catalogos.getInstituciones$() : of(this.catalogos.instituciones)),
        takeUntil(this.destroy$)
      ).subscribe(list => this.instituciones2 = list);

    // institucion2 -> dependencias2
    this.form.get('institucion2')!.valueChanges
      .pipe(startWith(this.form.get('institucion2')!.value), takeUntil(this.destroy$))
      .subscribe(id => this.cargarDependenciasLocal2(id));

    // dependencia2 -> corporacion2
    this.form.get('dependencia2')!.valueChanges
      .pipe(startWith(this.form.get('dependencia2')!.value), takeUntil(this.destroy$))
      .subscribe(id => this.cargarCorporacionesLocal2(id));
  }

  // ===== Helpers =====
  private resetControl(name: string) {
    const c = this.form.get(name)!;
    c.reset(null, { emitEvent: false });
    c.setErrors(null);
  }
  private resetControls(names: string[]) { names.forEach(n => this.resetControl(n)); }

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

  private cargarDependenciasLocal(parentId: number | null) {
    const pid = parentId == null ? null : Number(parentId);
    if (pid == null) {
      this.dependencias = []; this.form.get('dependencia')!.setValue(null, { emitEvent: false });
      this.corporaciones = []; this.form.get('corporacion')!.setValue(null, { emitEvent: false });
      this.areas = []; this.form.get('area')!.setValue(null, { emitEvent: false });
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
      this.corporaciones = []; this.form.get('corporacion')!.setValue(null, { emitEvent: false });
      this.areas = []; this.form.get('area')!.setValue(null, { emitEvent: false });
      return;
    }
    if (pid === 0) {
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
      this.form.get('area')?.setValue(null, { emitEvent: false });
      return;
    }
    if (pid === 0) {
      this.areas = [this.NO_APLICA];
      this.form.get('area')?.setValue(0, { emitEvent: false });
      return;
    }
    const items = this.estructura
      .filter(x => x.tipo === 'area' && x.fK_PADRE === pid)
      .map(x => ({ id: x.id, nombre: x.nombre }));
    this.areas = items.length ? items : [this.NO_APLICA];
    this.form.get('area')?.setValue(this.areas[0]?.id ?? null, { emitEvent: false });
  }

  private cargarDependenciasLocal2(parentId: number | null) {
    const pid = parentId == null ? null : Number(parentId);
    if (pid == null) {
      this.dependencias2 = []; this.form.get('dependencia2')!.setValue(null, { emitEvent: false });
      this.corporaciones2 = []; this.form.get('corporacion2')!.setValue(null, { emitEvent: false });
      return;
    }
    if (pid === 0) {
      this.dependencias2 = [this.NO_APLICA];
      this.form.get('dependencia2')!.setValue(0, { emitEvent: true });
      return;
    }
    const items = this.estructura
      .filter(x => x.tipo === 'dependencia' && x.fK_PADRE === pid)
      .map(x => ({ id: x.id, nombre: x.nombre }));
    this.dependencias2 = items.length ? items : [this.NO_APLICA];
    this.form.get('dependencia2')!.setValue(this.dependencias2[0].id, { emitEvent: true });
  }

  private cargarCorporacionesLocal2(parentId: number | null) {
    const pid = parentId == null ? null : Number(parentId);
    if (pid == null) {
      this.corporaciones2 = []; this.form.get('corporacion2')!.setValue(null, { emitEvent: false });
      return;
    }
    if (pid === 0) {
      this.corporaciones2 = [this.NO_APLICA];
      this.form.get('corporacion2')!.setValue(0, { emitEvent: true });
      return;
    }
    const items = this.estructura
      .filter(x => x.tipo === 'corporacion' && x.fK_PADRE === pid)
      .map(x => ({ id: x.id, nombre: x.nombre }));
    this.corporaciones2 = items.length ? items : [this.NO_APLICA];
    this.form.get('corporacion2')!.setValue(this.corporaciones2[0].id, { emitEvent: true });
  }

  private toNumOrNull(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  private getEstructuraSeleccionadaId(): number | null {
    const ids = [
      this.toNumOrNull(this.form.get('area')?.value),
      this.toNumOrNull(this.form.get('corporacion')?.value),
      this.toNumOrNull(this.form.get('dependencia')?.value),
      this.toNumOrNull(this.form.get('institucion')?.value),
    ];
    return ids.find(x => x != null) ?? null;
  }
  private getEstructuraComisionId(): number | null {
    const ids = [
      this.toNumOrNull(this.form.get('corporacion2')?.value),
      this.toNumOrNull(this.form.get('dependencia2')?.value),
      this.toNumOrNull(this.form.get('institucion2')?.value),
    ];
    return ids.find(x => x != null) ?? null;
  }

  private buildStep2Snapshot(): Step2State {
    const v = this.form.getRawValue();
    const ent = this.toNumOrNull(v.entidad);
    const mun = this.toNumOrNull(v.municipioAlcaldia2);
    const area = this.getEstructuraSeleccionadaId();

    const ent2 = this.toNumOrNull(v.entidad2) ?? ent;
    const mun2 = this.toNumOrNull(v.municipioAlcaldia3) ?? mun;
    const corp2 = this.getEstructuraComisionId() ?? area;

    return {
      entidad: ent ?? null,
      municipio: mun ?? null,
      area: area ?? null,
      entidad2: ent2 ?? null,
      municipio2: mun2 ?? null,
      corporacion2: corp2 ?? null,
    };
  }

  private mapFormToStep1(v: any) {
    const toId = (x: any): number | null => {
      const n = Number(x);
      return Number.isFinite(n) && n !== 0 ? n : null;
    };
    return {
      rfc: v.rfc ?? null,
      curp: v.curp ?? null,
      cuip: v.cuip ?? null,
      nombre: v.nombre ?? null,
      nombre2: null,
      apellidoPaterno: v.primerApellido ?? null,
      apellidoMaterno: v.segundoApellido ?? null,
      tipoUsuario: toId(v.tipoUsuario) ?? undefined,
    };
  }

  private invalidWithoutCaptcha(): boolean {
    const controls = (this.form as any).controls as { [k: string]: AbstractControl };
    for (const name of Object.keys(controls)) {
      if (name === 'captchaCode') continue;
      if (controls[name].invalid) return true;
    }
    return false;
  }
  private scrollToFirstError() {
    const el = document.querySelector('.ng-invalid[formcontrolname], .ng-invalid [formControlName]') as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private applyCommissionState(isOn: boolean) {
    const controls = ['tipoInstitucion2', 'entidad2', 'municipioAlcaldia3', 'institucion2', 'dependencia2', 'corporacion2'];
    const required = new Set(['tipoInstitucion2', 'entidad2', 'municipioAlcaldia3', 'institucion2']);
    for (const name of controls) {
      const c = this.form.get(name)!;
      if (isOn) {
        c.enable({ emitEvent: false });
        c.setValidators(required.has(name) ? [Validators.required] : []);
      } else {
        c.reset(null, { emitEvent: false });
        c.setErrors(null);
        c.clearValidators();
        c.disable({ emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    }
  }

  // Progreso UI
  get progressPercent(): number {
    return Math.round((this.currentStep / (this.maxSteps || 1)) * 100);
  }
}
