// File: src/app/usuarios/carga-usuario/carga-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { CedulaModel } from '../../models/cedula.model';
import { CedulaModel as CedulaModelPDF } from '../../services/pdf.service';
import { CatalogosService, CatalogoItem, CatEstructuraDto } from '../../services/catalogos.service';
import { UsuarioService } from '../../services/usuario.service';
import { ExcelUsuarioRow } from '../../models/excel.model';
import { CargaUsuarioStoreService } from '../../services/carga-usuario-store.service';
import { FormArray, ValidatorFn } from '@angular/forms';


/**
 * Componente para crear/editar la cédula de usuario
 */
@Component({
  selector: 'app-carga-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './carga-usuario.html',
  styleUrls: ['./carga-usuario.scss']
})
export class CargaUsuarioComponent implements OnInit {
  // Para ngModel en perfiles
  perfilConsultaInput: string = '';
  // Catálogo de perfiles para datalist
  perfiles: { id: number; clave: string; nombre: string }[] = [];
  userForm!: FormGroup;
  loading = false;

  // Catálogos para selects
  tiposUsuario: CatalogoItem[] = [];
  entidades: CatalogoItem[] = [];
  municipios: CatalogoItem[] = [];
  municipios2: CatalogoItem[] = [];
  dependencias: CatalogoItem[] = [];
  corporaciones: CatalogoItem[] = [];
  institucionOptions: CatalogoItem[] = [];
  areaOptions: CatalogoItem[] = [];
  estructura: CatEstructuraDto[] = [];
  paisOptions: CatalogoItem[] = [];    // <-- nuevo
  // catálogos secundarios
  dependencias2: CatalogoItem[] = [];
  corporaciones2: CatalogoItem[] = [];
  areaOptions2: CatalogoItem[] = [];

  // Opciones tipo checkbox
  opciones = ['Nueva Cuenta',
    'Modificación de Perfiles',
    'Ampliación de Perfiles',
    'Reactivación de Cuenta',
    'Cambio de Adscripción'];

  constructor(
    private fb: FormBuilder,
    private svc: CargaUsuarioService,
    private catalogos: CatalogosService,
    private router: Router,
    private usuarioSvc: UsuarioService,
    private store: CargaUsuarioStoreService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.initForm();

    // 1) Cargar todos los catálogos una sola vez
    this.catalogos.getAll().subscribe(res => {
      // justo al recibir res:
      this.estructura = (res.Estructura || []).map((e: any) => ({
        id: e.id ?? e.ID,
        nombre: e.nombre ?? e.NOMBRE,
        tipo: String(e.tipo ?? e.TIPO).toLowerCase(), // <- normalizado
        fK_PADRE: e.fK_PADRE ?? e.FK_PADRE
      }));

      this.institucionOptions = this.estructura
        .filter(n => n.tipo === 'institucion' && n.fK_PADRE == null)
        .map(n => ({ id: n.id, nombre: n.nombre }));

      // y para dependencias/corporaciones/áreas
      // this.estructura.filter(x => x.tipo === 'dependencia' && x.fK_PADRE === institucionId) ...


      // Tipo de usuario (id / tP_USUARIO)
      this.tiposUsuario = (res.TipoUsuario || [])
        .map((x: any) => ({ id: x.id, nombre: x.tP_USUARIO }));

      // Entidades: sólo los ESTADO para el combo principal
      this.entidades = (res.Entidades || [])
        .filter((e: any) => e.tipo === 'ESTADO')
        .map((e: any) => ({ id: e.id, nombre: e.nombre }));

      // Perfiles: funcion -> nombre
      this.perfiles = (res.Perfiles || [])
        .map((p: any) => ({ id: p.id, clave: p.clave, nombre: p.funcion }));

      // Listas dependientes
      this.dependencias = [];
      this.corporaciones = [];
      this.areaOptions = [];
      this.paisOptions = (res.Paises || []).map(p => ({ id: p.id, nombre: p.nombre }));

      // 2) Si vienes de Carga Masiva, usa el objeto del state y NO hagas GET
      const navState = this.router.getCurrentNavigation()?.extras?.state as any;
      const cedulaParaEditar =
        navState?.cedula ?? (history.state as any)?.cedula;

      if (cedulaParaEditar) {
        this.patchFormFromCedula(cedulaParaEditar);
        this.loading = false;
        return; // <- evita el GET si ya traes la cédula
      }

      // 3) Si NO hay state, intenta cargar por :indice
      const idParam = this.route.snapshot.paramMap.get('indice');
      const id = idParam ? Number(idParam) : NaN;

      if (!isNaN(id) && id > 0) {
        this.svc.getUsuario(id).subscribe({
          next: (data: CedulaModel) => {
            this.userForm.patchValue(data);
            // disparar cascadas según valores del backend
            this.onEntidadChange(data.entidad || null);
            this.onEntidadComisionadoChange(data.entidad2 || null);
            this.loading = false;
          },
          error: _ => {
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
      }
    });
  }

  /** Rellena el formulario con los valores de la fila de Excel */
  private patchFormFromCedula(c: ExcelUsuarioRow) {
    // patchFormFromCedula(...)
    const checksInit = [!!c.checkBox1, !!c.checkBox2, !!c.checkBox3, !!c.checkBox4, !!c.checkBox5];
    this.checks.patchValue(checksInit, { emitEvent: false });
    const idx = checksInit.findIndex(v => v);
    if (idx >= 0) this.setSingleCheck(idx);
    this.setSingleCheck(0);
    // 1) parchea valores básicos
    this.userForm.patchValue({
      fill1: c.fill1,
      nombre: c.nombre,
      nombre2: c.nombre2,
      apellidoPaterno: c.apellidoPaterno,
      apellidoMaterno: c.apellidoMaterno,
      rfc: c.rfc,
      curp: c.curp,
      cuip: c.cuip,
      correoElectronico: c.correoElectronico,
      telefono: c.telefono,
      tipoUsuario: c.tipoUsuario,
      entidad: c.entidad,
      municipio: c.municipio,
      institucion: c.institucion,
      dependencia: c.dependencia,
      corporacion: c.corporacion,
      area: c.area,
      cargo: c.cargo,
      funciones: c.funciones,
      pais: c.pais,
      entidad2: c.entidad2,
      municipio2: c.municipio2,
      corporacion2: c.corporacion2,
      // checkbox
      checkBox1: c.checkBox1,
      checkBox2: c.checkBox2,
      checkBox3: c.checkBox3,
      checkBox4: c.checkBox4,
      checkBox5: c.checkBox5,
      // los grupos dinámicos:
      consultaTextos: this.fb.group(c.consultaTextos),
      modulosOperacion: this.fb.group(c.modulosOperacion)
    });
    // patchFormFromCedula(...)
    const consultas = this.userForm.get('consultaTextos') as FormGroup;
    // Después de agregar los controles de consultaTextos
    Object.entries(c.consultaTextos).forEach(([key, val]) => {
      if (!consultas.contains(key)) {
        consultas.addControl(key, this.fb.control(val));
      }

      // Busca el nombre del perfil por la clave (val)
      const perfilEncontrado = this.perfiles.find(p => p.clave === val);
      if (perfilEncontrado) {
        consultas.get(key)?.setValue(`${perfilEncontrado.clave} - ${perfilEncontrado.nombre}`);
      }
    });
    const modulos = this.userForm.get('modulosOperacion') as FormGroup;
    Object.entries(c.modulosOperacion).forEach(([key, val]) => {
      if (!modulos.contains(key)) {
        modulos.addControl(key, this.fb.control(val));
      }
    });

    // 2) dispara las cargas en cascada para selects dependientes
    // 1) cargar municipios principales
    this.onEntidadChange(c.entidad);
    this.userForm.patchValue({ entidad: c.entidad });

    // 2) cargar municipios secundario usando el ID correcto
    this.onEntidadComisionadoChange(this.catalogos.getAreaIdByName(c.entidad2!));
    this.userForm.patchValue({ entidad2: this.catalogos.getAreaIdByName(c.entidad2!) });

    // 3) institución → dependencias
    this.cargarDependencias(c.institucion);
    this.userForm.patchValue({ institucion: c.institucion, dependencia: c.dependencia });

    // 4) dependencia → corporaciones
    this.cargarCorporaciones(c.dependencia);
    this.userForm.patchValue({ corporacion: c.corporacion });

    // 5) corporación → áreas
    this.cargarAreas(c.corporacion);
    this.userForm.patchValue({ area: c.area });
    if (c.pais && typeof c.pais === 'string') {
      const paisId = this.catalogos.getPaisIdByName(c.pais);
      if (paisId) this.userForm.patchValue({ pais: paisId });
    }
    // Actualiza el estado de todos los controles y valida de nuevo
    Object.values(this.userForm.controls).forEach(control => {
      control.updateValueAndValidity();
    });
    [this.userForm.get('consultaTextos'), this.userForm.get('modulosOperacion')].forEach(grupo => {
      if (grupo instanceof FormGroup) {
        Object.values(grupo.controls).forEach(ctrl => {
          ctrl.updateValueAndValidity();
        });
      }
    });
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });

    this.mostrarErrores(this.userForm);
  }
  // Helper: deja exactamente 1 check en true (el i)
  private setSingleCheck(i: number): void {
    for (let j = 0; j < this.checks.length; j++) {
      this.checks.at(j).setValue(j === i, { emitEvent: false });
    }
    this.checks.markAsDirty();
    this.checks.updateValueAndValidity({ emitEvent: false });
  }

  // Cambia tu handler para NO depender del $event
  onCheckArrayChange(i: number, ev?: Event): void {
    if (i !== 0) return;

    const checked = ev ? (ev.target as HTMLInputElement).checked
      : !!this.checks.at(i).value;

    if (checked) this.setSingleCheck(0);
    else this.checks.at(0).setValue(true, { emitEvent: false }); // Siempre debe haber 1: dejamos 0 en true
    if (checked) {
      this.setSingleCheck(i); // activo -> apaga los demás
    } else {
      // lo dejaron en false, sin más
      this.checks.at(i).setValue(false, { emitEvent: false });
    }

  }

  get checks(): FormArray {
    return this.userForm.get('checks') as FormArray;
  }

  /** Inicializa el formulario con campos y validaciones */
  private initForm(): void {
    const userId = this.usuarioSvc.getUserId();
    if (userId === null) {
      console.error('No hay userId en localStorage');
      this.loading = false;
      return;
    }
    this.userForm = this.fb.group({
      fill1: ['', [Validators.required, Validators.maxLength(20)]], // Oficio
      folio: [''],
      checks: this.fb.array(
        [false, false, false, false, false],
      ),

      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      nombre2: [''],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoMaterno: ['', [Validators.maxLength(100)]],
      fechaSolicitud: [new Date().toISOString().substring(0, 10), Validators.required],

      rfc: ['', [
        Validators.required,
        Validators.maxLength(13),
        Validators.pattern(/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i)
      ]],

      curp: ['', Validators.maxLength(18)],
      correoElectronico: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
      ]],
      telefono: ['', [
        Validators.pattern(/^\d{7,10}$/)
      ]],
      cuip: ['', Validators.maxLength(20)],

      tipoUsuario: [null, Validators.required],
      entidad: [null, Validators.required],
      municipio: [
        null,
        [
          Validators.required,
          (control: { value: number; }) => {
            const existe = this.municipios?.some(m => m.id === control.value);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      institucion: [
        null,
        [
          Validators.required,
          (control: { value: number; }) => {
            const existe = this.institucionOptions.some(i => i.id === control.value);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      dependencia: [
        null,
        [
          Validators.required,
          (control: { value: number; }) => {
            const existe = this.dependencias?.some(d => d.id === control.value);
            return existe ? null : { invalidOption: true };
          }
        ]
      ], corporacion: [
        null,
        [
          Validators.required,
          (control: { value: number; }) => {
            const existe = this.corporaciones?.some(c => c.id === control.value);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      area: [
        null,
        [
          Validators.required,
          (control: { value: number; }) => {
            const existe = this.areaOptions?.some(a => a.id === control.value);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      cargo: ['', [Validators.required, Validators.maxLength(100)]],
      funciones: ['', [Validators.required, Validators.maxLength(300)]],
      funciones2: [''],

      entidad2: [null],
      municipio2: [
        null,
        [
          // sin Validators.required -> NO obligatorio
          (control: AbstractControl): ValidationErrors | null => {
            const v = control.value; // puede venir como number | '' | null

            // vacío => válido
            if (v === null || v === undefined || v === '') return null;

            // normaliza a número
            const id = typeof v === 'string' ? parseInt(v, 10) : v;

            // si no es número válido, inválido
            if (!Number.isFinite(id)) return { invalidOption: true };

            // valida contra el catálogo sólo si hay valor
            const existe = this.municipios2.some(m => m.id === id);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      pais: [
        null,
        [
          // si no es obligatorio, no pongas Validators.required
          (ctrl: AbstractControl): ValidationErrors | null => {
            const v = ctrl.value;
            if (v === null || v === undefined || v === '') return null; // vacío = válido
            const id = typeof v === 'string' ? parseInt(v, 10) : v;
            if (!Number.isFinite(id)) return { invalidOption: true };
            const existe = this.paisOptions?.some(p => p.id === id);
            return existe ? null : { invalidOption: true };
          }
        ]
      ],
      institucion2: [null, [
        (c: AbstractControl) => {
          const v = c.value; if (v == null || v === '') return null;
          const id = typeof v === 'string' ? parseInt(v, 10) : v;
          return this.institucionOptions.some(i => i.id === id) ? null : { invalidOption: true };
        }
      ]],
      dependencia2: [null, [
        (c: AbstractControl) => {
          const v = c.value; if (v == null || v === '') return null;
          const id = typeof v === 'string' ? parseInt(v, 10) : v;
          return this.dependencias2.some(d => d.id === id) ? null : { invalidOption: true };
        }
      ]],
      corporacion2: [null, [
        (c: AbstractControl) => {
          const v = c.value; if (v == null || v === '') return null;
          const id = typeof v === 'string' ? parseInt(v, 10) : v;
          return this.corporaciones2.some(x => x.id === id) ? null : { invalidOption: true };
        }
      ]],
      consultaTextos: this.fb.group({}),
      modulosOperacion: this.fb.group({}),

      UserId: userId
    });
    const checksArr = this.userForm.get('checks') as FormArray;
    checksArr.at(0).setValue(true, { emitEvent: false });   // Nueva Cuenta ON
    for (let i = 1; i < checksArr.length; i++) {
      checksArr.at(i).disable({ emitEvent: false });        // Mod. perfiles, Ampliación, Reactivación, Cambio Adscripción OFF/disabled
    }
    // Reactivos para cargar municipios cuando cambia la entidad
    this.userForm.get('entidad')?.valueChanges.subscribe(val => this.onEntidadChange(val));
    this.userForm.get('entidad2')?.valueChanges.subscribe(val => this.onEntidadComisionadoChange(val));
    // Cuando selecciona Institución, carga Dependencias
    this.userForm.get('institucion')!.valueChanges
      .subscribe(parentId => this.cargarDependencias(parentId));

    // Cuando selecciona Dependencia, carga Corporaciones
    this.userForm.get('dependencia')!.valueChanges
      .subscribe(parentId => this.cargarCorporaciones(parentId));

    // Cuando selecciona Corporación, carga Áreas
    this.userForm.get('corporacion')!.valueChanges
      .subscribe(parentId => this.cargarAreas(parentId));
  }

  /** Agrega perfil de consulta al formulario */
  agregarPerfilConsulta(): void {
    const key = this.perfilConsultaInput.trim();
    if (!key) return;
    const consultas = this.userForm.get('consultaTextos') as FormGroup;
    if (!consultas.contains(key)) {
      consultas.addControl(key, this.fb.control(this.perfilConsultaInput));
      this.perfilConsultaInput = '';
    }
  }

  /** Obtiene las llaves de consultaTextos para ngFor */
  getConsultaTextosKeys(): string[] {
    const consultas = this.userForm.get('consultaTextos') as FormGroup;
    return Object.keys(consultas.controls);
  }

  // Después de tu método getConsultaTextosKeys()
  /** Obtiene las llaves de modulosOperacion para el ngFor */
  getModulosOperacionKeys(): string[] {
    const modulos = this.userForm.get('modulosOperacion') as FormGroup;
    return Object.keys(modulos.controls);
  }


  /** Quita un perfil de consulta del formulario */
  quitarConsulta(key: string): void {
    const consultas = this.userForm.get('consultaTextos') as FormGroup;
    if (consultas.contains(key)) {
      consultas.removeControl(key);
    }
  }

  /** Carga municipios según entidad seleccionada */
  private onEntidadChange(entidadId: number | null): void {
    if (!entidadId) {
      this.municipios = [];
      this.userForm.get('municipio')?.setValue(null);
      return;
    }
    this.catalogos.getMunicipios(entidadId).subscribe(data => this.municipios = data);
  }

  /** Carga municipios de comisionado */
  private onEntidadComisionadoChange(entidadId: number | null): void {
    if (!entidadId) {
      this.municipios2 = [];
      this.userForm.get('municipio2')?.setValue(null);
      return;
    }
    this.catalogos.getMunicipios(entidadId).subscribe(data => this.municipios2 = data);
  }

  /** Envía el formulario al servicio */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const f = this.userForm.getRawValue();
    const checks = (f.checks as boolean[]).map(Boolean);
    const [cb1, cb2, cb3, cb4, cb5] = (this.checks.value as boolean[]).map(Boolean);
    const municipioId: number =
      typeof f.municipio === 'number'
        ? f.municipio
        : (
          // intenta por nombre
          this.catalogos.getMunicipioIdByName(String(f.municipio ?? '').trim())
          // intenta parsear número
          ?? parseInt(String(f.municipio ?? ''), 10)
          // fallback
          ?? 0
        );
    const municipioNombre =
      this.catalogos.getMunicipioNameById?.(municipioId) // si tienes este helper
      ?? (this.municipios.find(m => m.id === municipioId)?.nombre || '');
    const userId = this.usuarioSvc.getUserId();
    if (userId === null) {
      console.error('No hay userId en localStorage');
      this.loading = false;
      return;
    }
    console.log(municipioNombre);
    // Helper para evitar null/undefined y forzar string seguro
    const safeString = (v: any): string => (v === null || v === undefined ? '' : String(v));
    const paisId: number | null =
      typeof f.pais === 'number' ? f.pais : (this.catalogos.getPaisIdByName(String(f.pais ?? '')) ?? null);
    const paisNombre = paisId ? this.catalogos.getPaisNameById(paisId) : null;
    // --- 1) Construir modelo para la API (POST) ---
    const estructura2Id = this.getAreaJerarquica2(f);
    const apiCedula: CedulaModel = {
      fill1: f.fill1,
      folio: '', // lo genera el SP
      cuentaUsuario: '',
      correoElectronico: f.correoElectronico,
      telefono: f.telefono,
      apellidoPaterno: f.apellidoPaterno,
      apellidoMaterno: f.apellidoMaterno || null,
      nombre: f.nombre,
      nombre2: f.nombre2 || null,
      checkBox1: cb1,
      checkBox2: cb2,
      checkBox3: cb3,
      checkBox4: cb4,
      checkBox5: cb5,
      rfc: f.rfc,
      cuip: f.cuip || null,
      curp: f.curp || null,
      tipoUsuario: f.tipoUsuario,
      entidad: f.entidad,
      municipio: f.municipio,
      institucion: f.institucion,
      corporacion: f.corporacion,
      area: this.getAreaJerarquica(f),
      cargo: f.cargo,
      funciones: f.funciones,
      funciones2: f.funciones2 || null,
      pais: paisId || null || undefined,
     entidad2: f.entidad2 || null,
     municipio2: f.municipio2 || null,
  // manda el ID final de estructura de comisión aquí:
      corporacion2: estructura2Id || null||undefined,
      consultaTextos: this.transformarPerfiles(f.consultaTextos),
      modulosOperacion: this.transformarModulos(f.modulosOperacion),
      entidadNombre: '', // si tu API no requiere estos puedes dejarlos vacíos
      municipioNombre: '',
      institucionNombre: '',
      dependenciaNombre: '',
      corporacionNombre: '',
      areaNombre: '',
      entidad2Nombre: '',
      municipio2Nombre: '',
      corporacion2Nombre: '',
      dependencia: 0,
      descargar: false,
      opciones: false,
      perfiles: false
    };

    // --- 2) Construir modelo para el PDF ---
    const pdfCedula: CedulaModelPDF = {

      fill1: safeString(f.fill1) || null,
      folio: safeString(f.folio) || null,
      cuentaUsuario: undefined,
      correoElectronico: f.correoElectronico,
      telefono: f.telefono,
      apellidoPaterno: f.apellidoPaterno,
      apellidoMaterno: f.apellidoMaterno || null,
      nombre: f.nombre,
      nombre2: f.nombre2 || null,
      rfc: f.rfc,
      cuip: f.cuip || null,
      curp: f.curp || null,
      tipoUsuario: f.tipoUsuario,
      entidad: f.entidad,
      municipio: f.municipio,
      institucion: f.institucion,
      corporacion: f.corporacion,
      area: this.getAreaJerarquica(f),
      cargo: f.cargo,
      funciones: f.funciones,
      funciones2: f.funciones2 || null,
      pais: paisNombre || null,
      entidad2: f.entidad2 || null,
      municipio2: f.municipio2 || null,
      corporacion2: f.corporacion2 || null,
      consultaTextos: this.transformarPerfiles(f.consultaTextos),
      modulosOperacion: this.transformarModulos(f.modulosOperacion),
      checkBox1: cb1,
      checkBox2: cb2,
      checkBox3: cb3,
      checkBox4: cb4,
      checkBox5: cb5,
      entidadNombre: this.catalogos.getEntidadNameById(f.entidad) ??
        this.entidades.find(e => e.id === f.entidad)?.nombre ?? '',
      municipioNombre: this.catalogos.getMunicipioNameById?.(f.municipio) ??
        this.municipios.find(m => m.id === municipioId)?.nombre ?? '',
      institucionNombre: this.catalogos.getInstitucionNameById(f.institucion) ??
        this.institucionOptions.find(i => i.id === f.institucion)?.nombre ?? '',
      dependenciaNombre: f.dependencia && f.dependencia !== 0
        ? (this.catalogos.getDependenciaNameById(f.dependencia) ??
          this.dependencias.find(d => d.id === f.dependencia)?.nombre ?? '')
        : '',
      corporacionNombre: f.corporacion && f.corporacion !== 0
        ? (this.catalogos.getCorporacionNameById(f.corporacion) ??
          this.corporaciones.find(c => c.id === f.corporacion)?.nombre ?? '')
        : '',
      areaNombre: f.area && f.area !== 0
        ? (this.catalogos.getAreaNameById(f.area) ??
          this.areaOptions.find(a => a.id === f.area)?.nombre ?? '')
        : '',
    };

    // --- 3) Edición proveniente de carga masiva ---
    const cedulaParaEditar = (history.state as any).cedula as ExcelUsuarioRow | undefined;
    const indiceParam = this.route.snapshot.params['indice'];
    const indice = Number(indiceParam);
    if (cedulaParaEditar && !isNaN(indice)) {
      const datos = this.store.getDatosCargados();
      const target = datos[indice];
      if (target) {
        // Actualiza mínimamente el ExcelUsuarioRow para reflejar cambios y marcarlo corregido
        target.fill1 = pdfCedula.fill1 ?? target.fill1;
        target.nombre = pdfCedula.nombre ?? target.nombre;
        target.nombre2 = pdfCedula.nombre2 ?? target.nombre2;
        target.apellidoPaterno = pdfCedula.apellidoPaterno ?? target.apellidoPaterno;
        target.apellidoMaterno = pdfCedula.apellidoMaterno ?? target.apellidoMaterno;
        target.rfc = pdfCedula.rfc ?? target.rfc;
        target.curp = pdfCedula.curp ?? target.curp;
        target.cuip = pdfCedula.cuip ?? target.cuip;
        target.correoElectronico = pdfCedula.correoElectronico ?? target.correoElectronico;
        target.telefono = pdfCedula.telefono ?? target.telefono;
        target.tipoUsuario = pdfCedula.tipoUsuario ?? target.tipoUsuario;
        target.entidad = pdfCedula.entidad != null ? pdfCedula.entidad : target.entidad;
        target.municipio = municipioNombre || target.municipio;
        target.municipioNombre = municipioNombre || target.municipioNombre;
        target.institucion = pdfCedula.institucion != null ? pdfCedula.institucion : target.institucion;
        // dependencia si aplica igual que antes
        target.corporacion = pdfCedula.corporacion != null ? pdfCedula.corporacion : target.corporacion;
        target.area = pdfCedula.area != null ? pdfCedula.area : target.area;
        target.cargo = pdfCedula.cargo ?? target.cargo;
        target.funciones = pdfCedula.funciones ?? target.funciones;
        target.pais = pdfCedula.pais ?? target.pais;
        target.entidad2 = pdfCedula.entidad2 != null ? String(pdfCedula.entidad2) : target.entidad2;
        target.municipio2 = pdfCedula.municipio2 != null ? String(pdfCedula.municipio2) : target.municipio2;
        target.corporacion2 = pdfCedula.corporacion2 != null ? String(pdfCedula.corporacion2) : target.corporacion2;
        target.consultaTextos = pdfCedula.consultaTextos || target.consultaTextos;
        target.modulosOperacion = pdfCedula.modulosOperacion || target.modulosOperacion;
        target.checkBox1 = cb1;
        target.checkBox2 = cb2;
        target.checkBox3 = cb3;
        target.checkBox4 = cb4;
        target.checkBox5 = cb5;
        // Recalcular validación igual que en carga masiva original
        const errores: string[] = [];
        if (!target.fill1) errores.push('Oficio es obligatorio');
        else if (target.fill1.length > 20) errores.push('Oficio: máximo 20 caracteres');

        if (!target.nombre) errores.push('Nombre(s) es obligatorio');
        else if (target.nombre.length > 100) errores.push('Nombre(s): máximo 100 caracteres');

        if (!target.apellidoPaterno) errores.push('Apellido Paterno es obligatorio');
        else if (target.apellidoPaterno.length > 100) errores.push('Apellido Paterno: máximo 100 caracteres');

        if (target.apellidoMaterno && target.apellidoMaterno.length > 100)
          errores.push('Apellido Materno: máximo 100 caracteres');

        if (!target.rfc) errores.push('RFC es obligatorio');
        else if (!/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i.test(target.rfc))
          errores.push('RFC formato inválido');

        if (!target.correoElectronico) errores.push('Correo electrónico es obligatorio');
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target.correoElectronico))
          errores.push('Correo formato inválido');

        if (target.telefono && !/^\d{7,10}$/.test(target.telefono))
          errores.push('Teléfono debe tener 7–10 dígitos');

        ['entidad', 'institucion', 'dependencia', 'area'].forEach(k => {
          const v = target[k as keyof ExcelUsuarioRow] as number;
          if (typeof v === 'number' && v <= 0) errores.push(`${k} debe ser mayor que 0`);
        });

        if (!target.cargo) errores.push('Cargo es obligatorio');
        else if (target.cargo.length > 100) errores.push('Cargo: máximo 100 caracteres');

        if (!target.funciones) errores.push('Funciones es obligatorio');
        else if (target.funciones.length > 300) errores.push('Funciones: máximo 300 caracteres');

        if (target.pais && target.pais.length > 100) errores.push('País: máximo 100 caracteres');

        target.errores = errores;
        target.ok = errores.length === 0;
        target.descripcionerror = target.ok ? '' : `CAMPOS INCORRECTOS: ${errores.join(', ')}`;
        target.editado = true;

        this.store.setDatosCargados(datos);
        this.store.marcarCorregido(indice);
      }

      this.router.navigate(['/cargamasiva']);
      return;
    }

    // --- 4) Envío normal a backend ---
    this.loading = true;
    console.log('Payload API a enviar:', apiCedula);
    console.log('Payload PDF construido (no se envía automáticamente):', pdfCedula);
    console.log('DEBUG checks FormArray:', this.checks.value); // <-- debe mostrar uno en true
    console.log('Payload API a enviar:', apiCedula);
    this.svc.saveSolicitudFromCedula(apiCedula).subscribe({
      next: () => this.router.navigate(['/solicitudes']),
      error: err => {
        console.error('Error guardando solicitud:', err);
        this.loading = false;
      }
    });
  }

  /** Cancela y regresa a Solicitudes */
  onCancel(): void {
    this.router.navigate(['/solicitudes']);
  }

  /**
  * Carga dependencias hijas de la institución seleccionada,
  * o agrega el fallback { id: 0, nombre: 'NO APLICA' } si no hay datos.
  */
  public cargarDependencias(parentId: number | null) {
    const pid = parentId ? Number(parentId) : null;        // por si viene '12'
    if (!pid) {
      this.dependencias = [{ id: 0, nombre: 'NO APLICA' }];
      this.userForm.get('dependencia')!.setValue(0);
      return;
    }
    const items = (this.estructura || [])
      .filter(x => x.tipo === 'dependencia' && x.fK_PADRE === pid)  // <-- string
      .map(x => ({ id: x.id, nombre: x.nombre }));

    this.dependencias = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('dependencia')!.setValue(this.dependencias[0].id);
  }

  public cargarCorporaciones(parentId: number | null) {
    const pid = parentId ? Number(parentId) : null;
    if (!pid) {
      this.corporaciones = [{ id: 0, nombre: 'NO APLICA' }];
      this.userForm.get('corporacion')!.setValue(0);
      return;
    }
    const items = (this.estructura || [])
      .filter(x => x.tipo === 'corporacion' && x.fK_PADRE === pid)  // <-- string
      .map(x => ({ id: x.id, nombre: x.nombre }));

    this.corporaciones = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('corporacion')!.setValue(this.corporaciones[0].id);
  }

  public cargarAreas(parentId: number | null) {
    const pid = parentId ? Number(parentId) : null;
    if (!pid) {
      this.areaOptions = [{ id: 0, nombre: 'NO APLICA' }];
      this.userForm.get('area')!.setValue(0);
      return;
    }
    const items = (this.estructura || [])
      .filter(x => x.tipo === 'area' && x.fK_PADRE === pid)        // <-- string
      .map(x => ({ id: x.id, nombre: x.nombre }));

    this.areaOptions = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('area')!.setValue(this.areaOptions[0].id);
  }



  /**
 * Carga municipios según entidad seleccionada (mismo patrón que dependencias)
 */
  public cargarMunicipios(parentId: number | null) {
    if (!parentId) {
      this.municipios = [];
      this.userForm.get('municipio')!.setValue(null);
      return;
    }
    this.catalogos.getMunicipios(parentId).subscribe(data => {
      console.log('Municipios for entidad', parentId, data);
      this.municipios = data;
    });
  }
  private transformarPerfiles(inputs: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    Object.values(inputs).forEach((text, i) => {
      // Text8..Text35 (28 slots)
      const key = `Text${8 + i}`;
      // "0508 - Consulta Estatal RNIP (FC)" → "0508"
      out[key] = text.split(' - ')[0].trim();
    });
    return out;
  }

  private transformarModulos(inputs: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    Object.values(inputs).forEach((text, i) => {
      // Text36..Text63 (28 slots)
      const key = `Text${36 + i}`;
      out[key] = text.split(' - ')[0].trim();
    });
    return out;
  }

  onCheckboxChange(selectedIndex: number): void {
    // Enciende explícitamente el seleccionado…
    this.userForm.get('checkBox' + selectedIndex)?.setValue(true, { emitEvent: false });

    // …y apaga todos los demás
    for (let i = 1; i <= this.opciones.length; i++) {
      if (i === selectedIndex) continue;
      this.userForm.get('checkBox' + i)?.setValue(false, { emitEvent: false });
    }
  }

  private getAreaJerarquica(f: any): number {
    if (f.area && f.area !== 0) return f.area;
    if (f.corporacion && f.corporacion !== 0) return f.corporacion;
    if (f.dependencia && f.dependencia !== 0) return f.dependencia;
    if (f.institucion && f.institucion !== 0) return f.institucion;
    return 0;
  }
  perfilesFiltrados(): { id: number; clave: string; nombre: string }[] {
    const consultaTextos = this.userForm.get('consultaTextos')?.value as Record<string, string> || {};

    const clavesUsadas = new Set<string>(
      Object.values(consultaTextos)
        .map((v: string) => v.split(' - ')[0].trim())
    );

    return this.perfiles.filter(p => !clavesUsadas.has(p.clave));
  }
  private mostrarErrores(form: FormGroup): void {
    Object.keys(form.controls).forEach(controlName => {
      const control = form.get(controlName);

      if (control instanceof FormGroup) {
        // Si es un grupo (como consultaTextos), aplica recursivamente
        this.mostrarErrores(control);
      } else {
        // Si es un campo simple, marca como tocado y fuerza validación
        control?.markAsTouched();
        control?.updateValueAndValidity();
      }
    });
  }
  public cargarDependencias2(parentId: number | null) {
  const pid = parentId ? Number(parentId) : null;
  if (!pid) { this.dependencias2 = []; this.userForm.get('dependencia2')!.setValue(null); return; }

  const items = (this.estructura || [])
    .filter(x => x.tipo === 'dependencia' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.dependencias2 = items;
  if (!items.length) this.userForm.get('dependencia2')!.setValue(null);
}

public cargarCorporaciones2(parentId: number | null) {
  const pid = parentId ? Number(parentId) : null;
  if (!pid) { this.corporaciones2 = []; this.userForm.get('corporacion2')!.setValue(null); return; }

  const items = (this.estructura || [])
    .filter(x => x.tipo === 'corporacion' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.corporaciones2 = items;
  if (!items.length) this.userForm.get('corporacion2')!.setValue(null);
}

public cargarAreas2(parentId: number | null) {
  const pid = parentId ? Number(parentId) : null;
  if (!pid) { this.areaOptions2 = []; this.userForm.get('area2')!.setValue(null); return; }

  const items = (this.estructura || [])
    .filter(x => x.tipo === 'area' && x.fK_PADRE === pid)
    .map(x => ({ id: x.id, nombre: x.nombre }));

  this.areaOptions2 = items;
  if (!items.length) this.userForm.get('area2')!.setValue(null);
}
private getAreaJerarquica2(f: any): number | null {
  if (f.area2)        return Number(f.area2);
  if (f.corporacion2) return Number(f.corporacion2);
  if (f.dependencia2) return Number(f.dependencia2);
  if (f.institucion2) return Number(f.institucion2);
  return null;
}
}