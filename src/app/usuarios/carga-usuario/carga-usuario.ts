// File: src/app/usuarios/carga-usuario/carga-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CargaUsuarioService, Opcion } from '../../services/carga-usuario.service';
import { CedulaModel } from '../../models/cedula.model';

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
  perfiles: Opcion[] = [];

  // Métodos para gestionar perfiles de consulta
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

  userForm!: FormGroup;
  loading = false;

  // Catálogos para selects
  tiposUsuario: Opcion[] = [];
  entidades: Opcion[] = [];
  municipios: Opcion[] = [];
  municipios2: Opcion[] = [];
  dependencias: Opcion[] = [];
  corporaciones: Opcion[] = [];
  institucionOptions: Opcion[] = [];
  areaOptions: Opcion[] = [];

  // Opciones tipo checkbox
  opciones = ['Nueva Cuenta', 'Modificación de Perfiles', 'Baja de Cuenta'];

  constructor(
    private fb: FormBuilder,
    private svc: CargaUsuarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.initForm();
    this.loadCatalogos();

    const id = this.route.snapshot.params['Indice'];
    if (id) {
      this.svc.getUsuario(id).subscribe((data: CedulaModel) => {
        this.userForm.patchValue(data);
        this.onEntidadChange(data.entidad);
        this.onEntidadComisionadoChange(data.entidad2!);
        this.loading = false;
      });
    } else {
      this.loading = false;
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
      // Campos dinámicos de perfiles y consultas
      consultaTextos: this.fb.group({}),
      modulosOperacion: this.fb.group({})
    });

    // Reactivos para cargar municipios cuando cambia la entidad
    this.userForm.get('entidad')?.valueChanges.subscribe(val => this.onEntidadChange(val));
    this.userForm.get('entidad2')?.valueChanges.subscribe(val => this.onEntidadComisionadoChange(val));
  }

  /** Carga catálogos iniciales */
  private loadCatalogos(): void {
    this.svc.getTiposUsuario().subscribe(data => this.tiposUsuario = data);
    this.svc.getEntidades().subscribe(data => this.entidades = data);
    this.svc.getMunicipios(this.userForm.get('entidad')?.value || 0).subscribe(data => this.municipios = data);
    this.svc.getDependencias().subscribe(data => this.dependencias = data);
    this.svc.getCorporaciones().subscribe(data => this.corporaciones = data);
    this.svc.getInstituciones().subscribe(data => this.institucionOptions = data);
    this.svc.getAreas().subscribe(data => this.areaOptions = data);
  }

  /** Carga municipios según entidad seleccionada */
  private onEntidadChange(entidadId: number): void {
    if (!entidadId) {
      this.municipios = [];
      this.userForm.get('municipio')?.setValue(null);
      return;
    }
    this.svc.getMunicipios(entidadId).subscribe(data => this.municipios = data);
  }

  /** Carga municipios de comisionado */
  private onEntidadComisionadoChange(entidadId: number): void {
    if (!entidadId) {
      this.municipios2 = [];
      this.userForm.get('municipio2')?.setValue(null);
      return;
    }
    this.svc.getMunicipios(entidadId).subscribe(data => this.municipios2 = data);
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
}
