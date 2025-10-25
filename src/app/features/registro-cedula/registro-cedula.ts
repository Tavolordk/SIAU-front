import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faTrash, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';

import { HeaderSiauComponent } from "../../shared/header-siau/header-siau";
import { SeleccionRequerimientosComponent, TipoRequerimiento } from "../seleccion-requerimientos/seleccion-requerimientos";
import { HeroCtaComponent } from "../../shared/hero-cta/hero-cta";

// Servicios y modelos
import { AdminCedulaDetalleService } from '../../services/admin-cedula-detalle.service';
import { AdminCedulaDetalleResponse } from '../../models/admin-cedula-detalle.model';
import { LoginActualizarEstadoService } from '../../services/login-actualizar-estado.service';
import { EstadoCedula } from '../../models/actualizar-estado-request.model';

type Opcion = { value: string; label: string; };

@Component({
  selector: 'app-registro-cedula',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    HeaderSiauComponent,
    SeleccionRequerimientosComponent,
    HeroCtaComponent,
  ],
  templateUrl: './registro-cedula.html',
  styleUrls: ['./registro-cedula.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroCedulaComponent {
  // Icons
  icons = { eye: faEye, trash: faTrash, save: faFloppyDisk };

  // Inyección
  private fb         = inject(FormBuilder);
  private detalleApi = inject(AdminCedulaDetalleService);
  private estadoApi  = inject(LoginActualizarEstadoService);

  // Inputs para carga automática
  @Input() cedulaId?: number | null;
  @Input() folio?: string | null;

  // Catálogos (el contenedor puede sobreescribirlos)
  @Input() sexos: Opcion[] = [];
  @Input() nacionalidades: Opcion[] = [];
  @Input() paises: Opcion[] = [];
  @Input() entidades: Opcion[] = [];
  @Input() municipios: Opcion[] = [];
  @Input() estadosCiviles: Opcion[] = [];
  @Input() tiposInstitucion: Opcion[] = [];
  @Input() instituciones: Opcion[] = [];
  @Input() dependencias: Opcion[] = [];
  @Input() corporaciones: Opcion[] = [];
  @Input() areas: Opcion[] = [];
  @Input() perfilesConsulta: Opcion[] = [];
  @Input() tiposDocumento: Opcion[] = [];

  // Outputs
  @Output() guardar   = new EventEmitter<any>();
  @Output() validar   = new EventEmitter<any>();
  @Output() rechazar  = new EventEmitter<any>();
  @Output() cancelar  = new EventEmitter<void>();
  @Output() visualizarDocumento = new EventEmitter<{ index: number }>();

  // UI state
  loadingConsulta = false;
  loadingEstado   = false;
  apiError: string | null = null;

  // Header dinámico
  usuarioNombre: string = '';
  usuarioCuenta: string = '';

  // Seleccion de requerimiento (TIPADO!)
  tipoSeleccionado: TipoRequerimiento | null = null;

  // Último detalle
  detalle?: AdminCedulaDetalleResponse;

  // Form
  form: FormGroup = this.fb.group({
    personal: this.fb.group({
      esPersonalSP: [null as boolean | null, Validators.required],
      usuario: [null],
      curp: ['', Validators.required],
      nombre: ['', Validators.required],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      sexo: [null, Validators.required],
      fechaNacimiento: [null, Validators.required],
      nacionalidad: [null, Validators.required],
      paisNacimiento: [null, Validators.required],
      entidadNacimiento: [null, Validators.required],
      municipioNacimiento: [null, Validators.required],
      estadoCivil: [null],
      rfc: [''],
      cuip: [''],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', Validators.required],
      aplicativo: [null],
    }),

    adscripcionActual: this.fb.group({
      tipoInstitucion: [null, Validators.required],
      entidad: [null, Validators.required],
      municipio: [null, Validators.required],
      institucion: [null, Validators.required],
      dependencia: [null, Validators.required],
      corporacion: [null, Validators.required],
      area: [null, Validators.required],
      funciones: [''],
      cargo: [''],
      fechaIngreso: [null, Validators.required],
      numeroEmpleado: [''],
    }),

    comision: this.fb.group({
      estaComisionado: [null as boolean | null, Validators.required],
      pais: [{ value: null, disabled: true }, Validators.required],
      tipoInstitucion: [{ value: null, disabled: true }, Validators.required],
      entidad: [{ value: null, disabled: true }, Validators.required],
      municipio: [{ value: null, disabled: true }, Validators.required],
      institucion: [{ value: null, disabled: true }, Validators.required],
      dependencia: [{ value: null, disabled: true }, Validators.required],
      corporacion: [{ value: null, disabled: true }, Validators.required],
      especificar: [{ value: '', disabled: true }],
    }),

    perfiles: this.fb.array<FormControl<string>>([]),
    documentos: this.fb.array<FormGroup>([]),

    perfilSeleccionado: [null as string | null],
    tipoDocumentoActual: [null as string | null],
  });

  // Getters
  get fPersonal()     { return this.form.get('personal') as FormGroup; }
  get fAds()          { return this.form.get('adscripcionActual') as FormGroup; }
  get fComision()     { return this.form.get('comision') as FormGroup; }
  get perfilesFA()    { return this.form.get('perfiles') as FormArray<FormControl<string>>; }
  get documentosFA()  { return this.form.get('documentos') as FormArray<FormGroup>; }

  // Init
  ngOnInit() {
    if (this.cedulaId != null) {
      this.cargarPorId(this.cedulaId);
    } else if (this.folio) {
      this.cargarPorFolio(this.folio);
    }
  }

  // Consultas
  cargarPorId(id: number) {
    this.apiError = null;
    this.loadingConsulta = true;
    this.detalleApi.porId(id)
      .pipe(finalize(() => this.loadingConsulta = false))
      .subscribe({
        next: (d) => { this.detalle = d; this.patchDetalle(d); },
        error: (e) => { this.apiError = e?.message ?? 'Error al consultar'; },
      });
  }

  cargarPorFolio(folio: string) {
    this.apiError = null;
    this.loadingConsulta = true;
    this.detalleApi.porFolio(folio)
      .pipe(finalize(() => this.loadingConsulta = false))
      .subscribe({
        next: (d) => { this.detalle = d; this.patchDetalle(d); },
        error: (e) => { this.apiError = e?.message ?? 'Error al consultar'; },
      });
  }

  // Mapear backend → form y encabezado
  private patchDetalle(d: AdminCedulaDetalleResponse) {
    // Encabezado
    this.usuarioNombre = d.usuario_sistema_nombre
      ?? `${(d.nombres ?? '').trim()} ${(d.primer_apellido ?? '').trim()}`.trim();
    this.usuarioCuenta = d.cuenta_codigo ?? '';

    // Tipo de requerimiento (enum tipado)
    this.tipoSeleccionado = this.mapTipoTramiteToReq(d.tipo_tramite);

    // Personal
    this.fPersonal.patchValue({
      esPersonalSP: d.personal_seguridad === 1,
      usuario: d.cuenta_codigo ?? null,
      curp: d.curp ?? '',
      nombre: d.nombres ?? '',
      primerApellido: d.primer_apellido ?? '',
      segundoApellido: d.segundo_apellido ?? '',
      sexo: d.sexo ?? null,
      fechaNacimiento: d.fecha_nacimiento ?? null,
      nacionalidad: d.nacionalidad ?? null,
      paisNacimiento: d.pais_nacimiento ?? null,
      entidadNacimiento: d.entidad_nacimiento ?? null,
      municipioNacimiento: d.municipio_alcaldia ?? null,
      estadoCivil: d.estado_civil ?? null,
      rfc: d.rfc ?? '',
      cuip: d.cuip ?? '',
      correo: d.correo_electronico ?? '',
      celular: d.telefono ?? '',
      aplicativo: d.tiene_telegram === 1,
    }, { emitEvent: false });

    // Adscripción
    this.fAds.patchValue({
      tipoInstitucion: d.tipo_institucion ?? null,
      entidad: d.entidad ?? null,
      municipio: d.municipio ?? null,
      institucion: d.institucion ?? null,
      dependencia: d.dependencia ?? null,
      corporacion: d.corporacion ?? null,
      area: d.area ?? null,
      funciones: d.funciones ?? '',
      cargo: d.cargo ?? '',
      fechaIngreso: d.fecha_ingreso ?? null,
      numeroEmpleado: d.numero_empleado ?? '',
    }, { emitEvent: false });

    // Comisión
    const esta = d.esta_comisionado === 1;
    this.fComision.patchValue({
      estaComisionado: esta,
      pais: d.pais_comision ?? null,
      tipoInstitucion: d.tipo_institucion_comision ?? null,
      entidad: d.entidad_comision ?? null,
      municipio: d.municipio_comision ?? null,
      institucion: d.institucion_comision ?? null,
      dependencia: d.dependencia_comision ?? null,
      corporacion: d.corporacion_comision ?? null,
      especificar: d.especificar_comision ?? '',
    }, { emitEvent: false });
    this.onCambioComisionado(esta);

    // Perfiles
    this.perfilesFA.clear();
    (d.perfiles ?? []).forEach((p: any) => {
      const code = typeof p === 'string' ? p : (p?.codigo ?? p?.code ?? null);
      if (code) this.perfilesFA.push(new FormControl<string>(code, { nonNullable: true }));
    });
  }

  // Mapear string del backend → enum del selector
  private mapTipoTramiteToReq(s?: string | null): TipoRequerimiento | null {
    if (!s) return null;
    const t = s.toLowerCase();
    if (t.includes('nueva_cuenta')) return 'NUEVA_CUENTA';
    if (t.includes('reacti')) return 'REACTIVACION';
    if (t.includes('ampli') || t.includes('modific')) return 'MODIFICACION';
    return null;
    // Ajusta reglas si tu backend usa otros textos
  }

  // Handler del output (cambio) del selector
  onCambioRequerimiento(v: TipoRequerimiento | null) {
    this.tipoSeleccionado = v;
  }

  // Estado (validar / rechazar)
  onValidar()  { this.actualizarEstado('Validada'); }
  onRechazar() { this.actualizarEstado('Rechazada'); }

  private actualizarEstado(nuevo: EstadoCedula | 'Validada' | 'Rechazada') {
    if (!this.detalle?.id) { this.apiError = 'No hay cédula cargada'; return; }
    this.apiError = null;
    this.loadingEstado = true;

    this.estadoApi.actualizarUno(this.detalle.id, nuevo as EstadoCedula)
      .pipe(finalize(() => this.loadingEstado = false))
      .subscribe({
        next: () => { this.detalle = { ...(this.detalle!), estado_solicitud: (nuevo as string) }; },
        error: (e) => { this.apiError = e?.message ?? 'Error al actualizar estado'; },
      });
  }

  // Comisión
  onCambioComisionado(value: boolean | null) {
    const keys = ['pais','tipoInstitucion','entidad','municipio','institucion','dependencia','corporacion','especificar'];
    keys.forEach(k => {
      const c = this.fComision.get(k)!;
      value ? c.enable({ emitEvent: false }) : c.disable({ emitEvent: false });
      if (!value) c.reset(null, { emitEvent: false });
    });
  }

  // CURP (stubs)
  buscarCurp()  {}
  validarCurp() {}

  // Perfiles
  agregarPerfilSeleccionado() {
    const v = this.form.get('perfilSeleccionado')!.value as string | null;
    if (!v) return;
    if (this.perfilesFA.value.includes(v)) return;
    this.perfilesFA.push(new FormControl<string>(v, { nonNullable: true }));
    this.form.get('perfilSeleccionado')!.reset();
  }
  eliminarPerfil(i: number) { this.perfilesFA.removeAt(i); }
  labelPerfil(v: string) { return this.perfilesConsulta.find(o => o.value === v)?.label ?? v; }

  // Documentos
  onArchivoSeleccionado(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const tipo = this.form.get('tipoDocumentoActual')!.value as string | null;
    if (!tipo) return;

    const file = input.files[0];
    const row = this.fb.group({
      tipo: [tipo, Validators.required],
      nombreArchivo: [file.name, Validators.required],
      archivo: [file],
    });
    this.documentosFA.push(row);

    input.value = '';
    this.form.get('tipoDocumentoActual')!.reset();
  }
  verDocumento(i: number)      { this.visualizarDocumento.emit({ index: i }); }
  eliminarDocumento(i: number) { this.documentosFA.removeAt(i); }
  labelDocumento(v: string) { return this.tiposDocumento.find(o => o.value === v)?.label ?? v; }

  // Botonera
  onGuardar()  { this.guardar.emit(this.form.getRawValue()); }
  onCancelar() { this.cancelar.emit(); }

  // (si sigues emitiendo además de llamar servicios)
  onValidarEmit()  { this.validar.emit(this.form.getRawValue()); }
  onRechazarEmit() { this.rechazar.emit(this.form.getRawValue()); }

  // Modal
  onCerrarModal() { /* no-op si usas modal */ }
}
