import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderSiauComponent } from "../../shared/header-siau/header-siau";
import { faEye, faTrash, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SeleccionRequerimientosComponent } from "../seleccion-requerimientos/seleccion-requerimientos";
import { HeroCtaComponent } from "../../shared/hero-cta/hero-cta";

type Opcion = { value: string; label: string; };

@Component({
  selector: 'app-registro-cedula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderSiauComponent, FontAwesomeModule, SeleccionRequerimientosComponent, HeroCtaComponent],
  templateUrl: './registro-cedula.html',
  styleUrls: ['./registro-cedula.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroCedulaComponent {
onCerrarModal() {
throw new Error('Method not implemented.');
}
    icons = {
    eye: faEye,
    trash: faTrash,            // también puedes usar faTrashCan si prefieres ese estilo
    save: faFloppyDisk,        // (en v6 reemplaza a faSave)
  };

  private fb = inject(FormBuilder);

  // Catálogos (puedes sobreescribir desde el padre)
  @Input() sexos: Opcion[] = [{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }];
  @Input() nacionalidades: Opcion[] = [{ value: 'MX', label: 'Mexicana' }];
  @Input() paises: Opcion[] = [{ value: 'MX', label: 'México' }];
  @Input() entidades: Opcion[] = [{ value: 'CDMX', label: 'CDMX' }];
  @Input() municipios: Opcion[] = [{ value: 'AO', label: 'Álvaro Obregón' }];
  @Input() estadosCiviles: Opcion[] = [{ value: 'SOLTERO', label: 'Soltero(a)' }, { value: 'CASADO', label: 'Casado(a)' }];
  @Input() tiposInstitucion: Opcion[] = [{ value: 'FEDERAL', label: 'Federal' }, { value: 'ESTATAL', label: 'Estatal' }];
  @Input() instituciones: Opcion[] = [{ value: 'GN', label: 'Guardia Nacional' }];
  @Input() dependencias: Opcion[] = [{ value: 'SSPC', label: 'Secretaría de Seguridad y Protección Ciudadana' }];
  @Input() corporaciones: Opcion[] = [{ value: 'GN', label: 'Guardia Nacional' }];
  @Input() areas: Opcion[] = [{ value: 'AREA01', label: 'Área 01' }];
  @Input() perfilesConsulta: Opcion[] = [
    { value: 'D401', label: 'Consulta - Perfil 1: D401' },
    { value: 'D402', label: 'Consulta - Perfil 2: D402' },
    { value: 'D405', label: 'Consulta - Perfil 3: D405' },
    { value: 'D409', label: 'Consulta - Perfil 4: D409' },
  ];
  @Input() tiposDocumento: Opcion[] = [
    { value: 'INE', label: 'Identificación oficial (INE)' },
    { value: 'RECIBO_NOMINA', label: 'Recibo de nómina (quincena inmediata anterior)' },
    { value: 'CREDENCIAL_LAB', label: 'Credencial laboral' },
  ];

  // Acciones
  @Output() guardar = new EventEmitter<any>();
  @Output() validar = new EventEmitter<any>();
  @Output() rechazar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() visualizarDocumento = new EventEmitter<{ index: number }>();

  // ==== FORM COMPLETO (coincide con el HTML) ====
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

    // selects auxiliares
    perfilSeleccionado: [null as string | null],
    tipoDocumentoActual: [null as string | null],
  });
usuarioNombre: string='Juan Pérez';
usuarioCuenta: string='jperez';

  // Getters de conveniencia
  get fPersonal()  { return this.form.get('personal') as FormGroup; }
  get fAds()       { return this.form.get('adscripcionActual') as FormGroup; }
  get fComision()  { return this.form.get('comision') as FormGroup; }
  get perfilesFA() { return this.form.get('perfiles') as FormArray<FormControl<string>>; }
  get documentosFA(){ return this.form.get('documentos') as FormArray<FormGroup>; }

  // Habilitar/deshabilitar campos de comisión
  onCambioComisionado(value: boolean | null) {
    const keys = ['pais','tipoInstitucion','entidad','municipio','institucion','dependencia','corporacion','especificar'];
    keys.forEach(k => {
      const c = this.fComision.get(k)!;
      value ? c.enable({emitEvent:false}) : c.disable({emitEvent:false});
      if (!value) c.reset(null, {emitEvent:false});
    });
  }

  // CURP (stubs)
  buscarCurp() {}
  validarCurp() {}

  // Perfiles
  agregarPerfilSeleccionado() {
    const v = this.form.get('perfilSeleccionado')!.value as string | null;
    if (!v) return;
    if (this.perfilesFA.value.includes(v)) return;
    this.perfilesFA.push(new FormControl(v, { nonNullable: true }));
    this.form.get('perfilSeleccionado')!.reset();
  }
  eliminarPerfil(i: number) { this.perfilesFA.removeAt(i); }

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
  verDocumento(i: number) { this.visualizarDocumento.emit({ index: i }); }
  eliminarDocumento(i: number) { this.documentosFA.removeAt(i); }

  // Helpers de etiquetas (para evitar arrow functions en el template)
  labelPerfil(v: string)     { return this.perfilesConsulta.find(o => o.value === v)?.label ?? v; }
  labelDocumento(v: string)  { return this.tiposDocumento.find(o => o.value === v)?.label ?? v; }

  // Botonera
  onGuardar()  { this.guardar.emit(this.form.getRawValue()); }
  onValidar()  { this.validar.emit(this.form.getRawValue()); }
  onRechazar() { this.rechazar.emit(this.form.getRawValue()); }
  onCancelar() { this.cancelar.emit(); }
}
