// File: src/app/usuarios/carga-usuario/carga-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { CedulaModel } from '../../models/cedula.model';
import { CatalogosService, CatalogoItem, CatEstructuraDto } from '../../services/catalogos.service';
import { UsuarioService } from '../../services/usuario.service';

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


  // Opciones tipo checkbox
  opciones = [  'Nueva Cuenta',
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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.initForm();
    // Carga todos los catálogos de una sola llamada
    this.catalogos.getAll().subscribe(res => {
      console.log('CatalogosService.getAll returned', res);
        this.estructura = res.Estructura;
      this.tiposUsuario = res.TipoUsuario.map(x => ({ id: x.ID, nombre: x.TP_USUARIO }));
      this.entidades    = res.Entidades.map(x => ({ id: x.ID, nombre: x.NOMBRE }));
      this.perfiles     = res.Perfiles.map(x => ({ id: x.ID, clave: x.CLAVE, nombre: x.FUNCION }));
      this.institucionOptions = this.estructura.filter(x => x.TIPO === 'INSTITUCION')
                                           .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
    this.dependencias  = [];
  this.corporaciones = [];
  this.areaOptions   = [];
      this.loading = false;
    });

    const id = this.route.snapshot.params['Indice'];
    if (id) {
      this.svc.getUsuario(id).subscribe((data: CedulaModel) => {
        this.userForm.patchValue(data);
        this.onEntidadChange(data.entidad || null);
        this.onEntidadComisionadoChange(data.entidad2 || null);
      });
    }
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
      fill1: ['', Validators.required],
      folio: [''],    
      checkBox1: [false],
      checkBox2: [false],
      checkBox3: [false],
      checkBox4: [false],
      checkBox5: [false],
      nombre: ['', Validators.required],
      nombre2: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      fechaSolicitud: [new Date().toISOString().substring(0, 10), Validators.required],
      rfc: ['', [Validators.required, Validators.maxLength(13)]],
      curp: ['', Validators.maxLength(18)],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: [''],
      cuip: [''],
      tipoUsuario: [null, Validators.required],
      entidad: [null, Validators.required],
      municipio: [null, Validators.required],
      institucion: [null, Validators.required],
      dependencia: [null],
      corporacion: [null],
      area: [null, Validators.required],
      cargo: ['', Validators.required],
      funciones: ['', Validators.required],
      funciones2: [''],
      entidad2: [null],
      municipio2: [null],
      pais: [''],
      corporacion2: [''],
      consultaTextos: this.fb.group({}),
      modulosOperacion: this.fb.group({}),
          UserId:            userId

    });

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

  this.loading = true;
  const f = this.userForm.value;
  const userId = this.usuarioSvc.getUserId();
  if (userId === null) {
    console.error('No hay userId en localStorage');
    this.loading = false;
    return;
  }

  const cedula = {
    Fill1:             f.fill1,
    Folio:             null,           // el SP genera el folio
    Nombre:            f.nombre,
    nombre2:           f.nombre2 || null,
    ApellidoPaterno:   f.apellidoPaterno,
    ApellidoMaterno:   f.apellidoMaterno || null,
    RFC:               f.rfc,
    CURP:              f.curp || null,
    CUIP:              f.cuip || null,
    Telefono:          f.telefono || null,
    CorreoElectronico: f.correoElectronico,
    Cargo:             f.cargo,
    Funciones:         f.funciones,
    Funciones2:        f.funciones2 || null,
    TipoUsuario:       f.tipoUsuario,
    Area:              f.area,
    Entidad:           f.entidad,
    Municipio:         f.municipio,
    Institucion:       f.institucion,
    Dependencia:       f.dependencia,
    Corporacion:       f.corporacion,
    Pais:              f.pais || null,
    entidad2:          f.entidad2 || null,
    municipio2:        f.municipio2 || null,
    corporacion2:      f.corporacion2 || null,
    CheckBox1:         f.checkBox1,
    CheckBox2:         f.checkBox2,
    CheckBox3:         f.checkBox3,
    CheckBox4:         f.checkBox4,
    CheckBox5:         f.checkBox5,
    ConsultaTextos:   this.transformarPerfiles(f.consultaTextos),
    ModulosOperacion: this.transformarModulos(f.modulosOperacion),
        UserId: userId,
  };

  // Para debugear, comprueba en consola:
  console.log('Payload a enviar:', cedula);

  this.svc.saveUsuarioSolicitud(cedula).subscribe({
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
public cargarDependencias(parentId: number|null) {
  if (!parentId) {
    this.dependencias = [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('dependencia')!.setValue(0);
    return;
  }
  const items = this.estructura
    .filter(x => x.TIPO === 'DEPENDENCIA' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
  this.dependencias = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
  this.userForm.get('dependencia')!.setValue(this.dependencias[0].id);
  console.log('Dependencias:', this.dependencias);
}

/**
 * Carga corporaciones hijas de la dependencia seleccionada,
 * o fallback si está vacío.
 */
public cargarCorporaciones(parentId: number|null) {
  if (!parentId) {
    this.corporaciones = [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('corporacion')!.setValue(0);
    return;
  }
  const items = this.estructura
    .filter(x => x.TIPO === 'CORPORACION' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
  this.corporaciones = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
  this.userForm.get('corporacion')!.setValue(this.corporaciones[0].id);
  console.log('Corporaciones:', this.corporaciones);
}

/**
 * Carga áreas hijas de la corporación seleccionada,
 * o fallback si está vacío.
 */
public cargarAreas(parentId: number|null) {
  if (!parentId) {
    this.areaOptions = [{ id: 0, nombre: 'NO APLICA' }];
    this.userForm.get('area')!.setValue(0);
    return;
  }
  const items = this.estructura
    .filter(x => x.TIPO === 'AREA' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
  this.areaOptions = items.length ? items : [{ id: 0, nombre: 'NO APLICA' }];
  this.userForm.get('area')!.setValue(this.areaOptions[0].id);
  console.log('Áreas:', this.areaOptions);
}

  /**
 * Carga municipios según entidad seleccionada (mismo patrón que dependencias)
 */
public cargarMunicipios(parentId: number|null) {
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
private transformarPerfiles(inputs: Record<string,string>): Record<string,string> {
  const out: Record<string,string> = {};
  Object.values(inputs).forEach((text, i) => {
    // Text8..Text35 (28 slots)
    const key = `Text${8 + i}`;
    // "0508 - Consulta Estatal RNIP (FC)" → "0508"
    out[key] = text.split(' - ')[0].trim();
  });
  return out;
}

private transformarModulos(inputs: Record<string,string>): Record<string,string> {
  const out: Record<string,string> = {};
  Object.values(inputs).forEach((text, i) => {
    // Text36..Text63 (28 slots)
    const key = `Text${36 + i}`;
    out[key] = text.split(' - ')[0].trim();
  });
  return out;
}
}

