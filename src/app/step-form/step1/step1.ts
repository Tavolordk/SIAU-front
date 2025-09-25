import { Component, Input, Output, EventEmitter, OnInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  curpValidator,
  rfcValidator,
  notOnlyWhitespaceValidator,
} from '../../shared/validators';
import { Step2State, StepFormStateService } from '../state/step-form-state.service';
import { CatalogosService, CatalogoItem } from '../../services/catalogos.service';
import { afterOrEqualControl, dateISOValidator, maxDate, minDate } from '../../shared/validators/date';
import { CaptchaBoxComponent } from "../../shared/captcha-box/captcha-box.component";
import { CaptchaApi } from '../../core/captcha/captcha.api';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { REQUEST_API_BASE_URL } from '../../core/token'; // ajusta la ruta si tu token está en otra carpeta
import { catchError, map } from 'rxjs/operators';

type NodoEstructura = { id: number; nombre: string; tipo: string; fK_PADRE: number | null };
type CurpStatus = 'idle' | 'checking' | 'ok' | 'invalid' | 'captchaInvalid' | 'error';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CaptchaBoxComponent],
  templateUrl: './step1.html',
  styleUrls: ['./step1.scss']
})
export class Step1Component implements OnInit, OnDestroy {
  @ViewChild(CaptchaBoxComponent) captchaBox?: CaptchaBoxComponent;
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<void>();

  @Input() form!: FormGroup;
  @Input() tipos: string[] = [];
  private estructura: NodoEstructura[] = [];
  todayISO = new Date().toISOString().slice(0, 10);
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
  // capturamos lo que emite <app-captcha-box>
  captchaId?: string;
  captchaAnswer = '';

  curpStatus: CurpStatus = 'idle';
  constructor(
    private fb: FormBuilder,
    private el: ElementRef<HTMLElement>,
    private state: StepFormStateService,
    private catalogos: CatalogosService,
    private captcha: CaptchaApi,
    private http: HttpClient,
    @Inject(REQUEST_API_BASE_URL) private requestApi: string
  ) { }

  ngOnInit(): void {
    // ----- form -----
    this.form = this.fb.group({
      tipoUsuario: [null, Validators.required],
      esSeguridad: [null, Validators.required],
      curp: ['', [Validators.required, Validators.maxLength(18), curpValidator()]],
      hp: [''],
      nombre: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      primerApellido: ['', [Validators.required, Validators.maxLength(100), notOnlyWhitespaceValidator]],
      segundoApellido: [''],
      captchaCode: ['', {
        validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
        asyncValidators: [this.captchaCorrectAsyncValidator()],
        updateOn: 'change'   // valida en caliente conforme se escribe
      }],

      sexo: [null, Validators.required],
      fechaNacimiento: ['', [Validators.required, dateISOValidator(), minDate('1900-01-01'),
      maxDate(this.todayISO)]],

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
      fechaIngreso: ['', [Validators.required, dateISOValidator(), minDate('1900-01-01'),
      maxDate(this.todayISO), afterOrEqualControl('fechaNacimiento')]],
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

        // Aplica/retira required
        ['tipoInstitucion2', 'entidad2', 'municipioAlcaldia3', 'institucion2'].forEach(cn => {
          const c = this.form.get(cn)!;
          c.setValidators(req);
          c.updateValueAndValidity({ emitEvent: false });
        });

        // Si NO está comisionado, limpia valores y errores del bloque
        if (v !== 'Si') {
          ['tipoInstitucion2', 'entidad2', 'municipioAlcaldia3', 'institucion2', 'dependencia2', 'corporacion2']
            .forEach(cn => {
              const c = this.form.get(cn)!;
              c.reset(null, { emitEvent: false });
              c.setErrors(null);
            });
        }
      });

    this.form.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(v => {
        this.state.save('step1', this.mapFormToStep1(v), false);
        this.state.patchStep2(this.buildStep2Snapshot(), true);
      });

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
  /** Convierte 0, '0', '', null, undefined -> null; si trae número válido lo regresa como number */
  private toNullableId(v: any): number | null {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return !Number.isFinite(n) || n === 0 ? null : n;
  }

  /** Convierte a número o null */
  private toId = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return !Number.isFinite(n) || n === 0 ? null : n;
  };

  /** Mapea el form a la forma que **sí** espera Step4 / backend */
  private mapFormToStep1(v: any) {
    return {
      // personales
      rfc: v.rfc ?? null,
      curp: v.curp ?? null,
      cuip: v.cuip ?? null,
      nombre: v.nombre ?? null,
      nombre2: null,
      apellidoPaterno: v.primerApellido ?? null,
      apellidoMaterno: v.segundoApellido ?? null,
      tipoUsuario: this.toId(v.tipoUsuario) ?? undefined,
      // (tel/correo no existen en Step1; se capturan en Step4)
    };
  }

  /** Actualiza step2 con lo que el SP necesita SIEMPRE que cambie el form
   *  y aplica fallback: si los campos de comisión vienen vacíos -> copia de adscripción.
   */
  private syncStep2FromForm(): void {
    const v = this.form.getRawValue();

    // Adscripción (principal)
    const entidad = this.toOptId(v.entidad);
    const municipio = this.toOptId(v.municipioAlcaldia2);
    const estructura1 = this.getEstructuraSeleccionadaId() ?? undefined; // area>corp>dep>inst

    // Comisión con fallback a adscripción
    const entidad2 = this.toOptId(v.entidad2) ?? entidad ?? undefined;
    const municipio2 = this.toOptId(v.municipioAlcaldia3) ?? municipio ?? undefined;
    const estructura2 = this.getEstructuraComisionId() ?? estructura1 ?? undefined;

    const next: Partial<Step2State> = {
      entidad, municipio,
      area: estructura1,                   // para p_area_estructura_id
      entidad2, municipio2,
      corporacion2: estructura2,           // 👈 este va a p_estructura2_id en el SP
    };

    this.state.save('step2', { ...(this.state.step2 ?? {}), ...next } as Step2State, /*persist*/ true);
  }


  /** number válido distinto de 0 -> number; de lo contrario -> undefined */
  private toOptId(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0 ? n : undefined;
  }
  /** number válido (>0) -> number; si no, null */
  private toNumOrNull(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /** Devuelve el id más profundo: area > corporación > dependencia > institución (o null) */
  private getEstructuraSeleccionadaId(): number | null {
    const ids = [
      this.toNumOrNull(this.form.get('area')?.value),
      this.toNumOrNull(this.form.get('corporacion')?.value),
      this.toNumOrNull(this.form.get('dependencia')?.value),
      this.toNumOrNull(this.form.get('institucion')?.value),
    ];
    return ids.find(x => x != null) ?? null;
  }
  /** Devuelve el id más profundo de la sección *Comisión*:
   *  (area2 si existe) > corporación2 > dependencia2 > institución2
   *  Nota: hoy no tienes area2, así que cae en corp2/dep2/inst2.
   */
  private getEstructuraComisionId(): number | null {
    const ids = [
      // this.toNumOrNull(this.form.get('area2')?.value), // si algún día agregas área2
      this.toNumOrNull(this.form.get('corporacion2')?.value),
      this.toNumOrNull(this.form.get('dependencia2')?.value),
      this.toNumOrNull(this.form.get('institucion2')?.value),
    ];
    return ids.find(x => x != null) ?? null;
  }

  /** Construye un snapshot consistente para step2 con fallback primario→secundario */
  private buildStep2Snapshot(): Step2State {
    const v = this.form.getRawValue();

    const ent = this.toNumOrNull(v.entidad);
    const mun = this.toNumOrNull(v.municipioAlcaldia2);
    const area = this.getEstructuraSeleccionadaId();

    // secundarios con fallback al primario cuando vengan vacíos
    const ent2 = this.toNumOrNull(v.entidad2) ?? ent;
    const mun2 = this.toNumOrNull(v.municipioAlcaldia3) ?? mun;
    const corp2 = this.getEstructuraComisionId() ?? area;

    const snap: Step2State = {
      entidad: ent ?? null,
      municipio: mun ?? null,
      area: area ?? null,

      entidad2: ent2 ?? null,
      municipio2: mun2 ?? null,
      corporacion2: corp2 ?? null,
    };

    // 🔎 Debug opcional
    console.debug('[Step1] Step2 snapshot', snap);

    return snap;
  }
  tryProceed(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.triedSubmit = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    if (this.form.value.hp) return;        // honeypot
    if (this.form.invalid) { this.scrollToFirstError(); return; }

    // Si ya hay token (p.ej. porque diste "Verificar CURP"), avanza directo
    const existing = this.captcha.getToken();
    if (existing) {
      const v = this.form.getRawValue();
      this.state.save('step1', this.mapFormToStep1(v), false);
      this.state.save('step2', this.buildStep2Snapshot(), true);
      this.next.emit();
      return;
    }

    // Si no hay token aún, verifica aquí el captcha antes de avanzar
    if (!this.captchaId || !this.captchaAnswer) {
      alert('Resuelve el captcha antes de continuar.');
      this.scrollToFirstError();
      return;
    }

    this.captcha.verify(this.captchaId, this.captchaAnswer).subscribe({
      next: res => {
        if (!res.ok || !res.token) {
          this.captchaBox?.refresh();
          alert('Código de verificación incorrecto o expirado. Intenta de nuevo.');
          return;
        }
        const v = this.form.getRawValue();
        this.state.save('step1', this.mapFormToStep1(v), false);
        this.state.save('step2', this.buildStep2Snapshot(), true);
        this.next.emit();
      },
      error: _ => {
        this.captchaBox?.refresh();
        alert('No se pudo verificar el captcha. Intenta de nuevo.');
      }
    });
  }

  onCaptchaChange(e: { id?: string; answer: string }) {
    this.captchaId = e.id;
    this.captchaAnswer = e.answer;
    // Actualiza el control oculto => disparará el validador asíncrono
    this.form.get('captchaCode')?.setValue(this.captchaAnswer);
    this.form.get('captchaCode')?.markAsTouched();
  }

  onVerifyCurp() {
    // Honeypot
    if (this.form.value.hp) return;

    // Valida CURP solo con tus validadores locales (ya tienes curpValidator)
    const curpCtrl = this.form.get('curp');
    if (!curpCtrl) return;
    curpCtrl.markAsTouched();
    if (curpCtrl.invalid) return;

    // Debe existir id/answer del captcha
    if (!this.captchaId || !this.captchaAnswer) {
      alert('Resuelve el captcha antes de verificar la CURP.');
      return;
    }

    // 1) Verifica CAPTCHA → guarda token (lo hace CaptchaApi internamente)
    this.captcha.verify(this.captchaId, this.captchaAnswer).subscribe({
      next: res => {
        if (!res.ok || !res.token) {
          this.curpStatus = 'invalid';
          this.captchaBox?.refresh();
          return;
        }

        // 2) SIN RENAPO: damos por válida la CURP si pasó validación local + captcha
        this.curpStatus = 'ok';
      },
      error: _ => {
        this.curpStatus = 'error';
        this.captchaBox?.refresh();
      }
    });
  }
  /** Valida contra el backend si el captcha es correcto (requiere captchaId y 6 dígitos) */
  private captchaCorrectAsyncValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl) => {
      const answer = (ctrl.value ?? '').toString().trim();
      const id = this.captchaId;

      // No dispares verificación si no hay id o el formato aún no es 6 dígitos
      if (!id || !/^\d{6}$/.test(answer)) {
        return of(null);
      }

      // Marca el control como "pending" mientras valida
      return this.captcha.verify(id, answer).pipe(
        map(res => {
          // Si es válido, CaptchaApi ya guarda token internamente (como haces en tu código)
          return (res?.ok && !!res?.token) ? null : { captchaInvalid: true };
        }),
        catchError(() => of<ValidationErrors>({ captchaError: true }))
      );
    };
  }
// Ejemplo si tu CaptchaBox emite un evento 'refreshed'
onCaptchaRefreshed(newId: string) {
  this.captchaId = newId;
  this.form.get('captchaCode')?.reset('', { emitEvent: true }); // borra respuesta y revalida
}

}
