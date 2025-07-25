// File: src/app/usuarios/carga-usuario/carga-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { CedulaModel } from '../../models/cedula.model';
import { CatalogosService, CatalogoItem, CatEstructuraDto } from '../../services/catalogos.service';

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
  opciones = ['Nueva Cuenta', 'Modificación de Perfiles', 'Baja de Cuenta'];

  constructor(
    private fb: FormBuilder,
    private svc: CargaUsuarioService,
    private catalogos: CatalogosService,
    private router: Router,
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
    this.userForm = this.fb.group({
      fill1: ['', Validators.required],
      checkBox1: [false],
      checkBox2: [false],
      checkBox3: [false],
      checkBox4: [false],
      checkBox5: [false],
      nombre: ['', Validators.required],
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
      entidad2: [null],
      municipio2: [null],
      pais: [''],
      corporacion2: [''],
      consultaTextos: this.fb.group({}),
      modulosOperacion: this.fb.group({})
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
    if (this.userForm.invalid) return;
    this.loading = true;
    const payload: CedulaModel = this.userForm.value;
    this.svc.saveUsuario(payload).subscribe({
      next: () => this.router.navigate(['/solicitudes']),
      error: () => this.loading = false
    });
  }

  /** Cancela y regresa a Solicitudes */
  onCancel(): void {
    this.router.navigate(['/solicitudes']);
  }

  public cargarDependencias(parentId: number|null) {
  console.log(parentId);
    if (!parentId) {
    this.dependencias = [];
    this.userForm.get('dependencia')!.setValue(null);
    return;
  }
  this.dependencias = this.estructura
    .filter(x => x.TIPO === 'DEPENDENCIA' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
    console.log('Dependencias:' + this.dependencias);
}

public cargarCorporaciones(parentId: number|null) {
  if (!parentId) {
    this.corporaciones = [];
    this.userForm.get('corporacion')!.setValue(null);
    return;
  }
  this.corporaciones = this.estructura
    .filter(x => x.TIPO === 'CORPORACION' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
        console.log('Corporaciones:' + this.corporaciones);

}

public cargarAreas(parentId: number|null) {
  if (!parentId) {
    this.areaOptions = [];
    this.userForm.get('area')!.setValue(null);
    return;
  }
  this.areaOptions = this.estructura
    .filter(x => x.TIPO === 'AREA' && x.FK_PADRE === parentId)
    .map(x => ({ id: x.ID, nombre: x.NOMBRE }));
    console.log('Areas:' + this.areaOptions);
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

}

