import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CatalogosService, CatPerfilDto } from '../../services/catalogos.service';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step2.html',
  styleUrls: ['./step2.scss']
})
export class Step2Component implements OnInit {
  @Input() form!: FormGroup;
  @Input() currentStep!: number;
  @Input() maxSteps!: number;

  @Output() addPerfil    = new EventEmitter<void>();
  @Output() removePerfil = new EventEmitter<number>();
  @Output() next         = new EventEmitter<void>();
  @Output() prev         = new EventEmitter<void>();

  @Input() perfiles: CatPerfilDto[] = [];       // 👈 catálogo completo
  perfilesFiltrados: CatPerfilDto[] = [];
  perfilesAgregados: CatPerfilDto[] = [];

  constructor(
    private fb: FormBuilder,
    private catalogosService: CatalogosService
  ) {}

  ngOnInit(): void {
    if (!this.form) {
      this.form = this.fb.group({
        perfil: ['', Validators.required]
      });
    }

    // 🔥 Cargar Perfiles desde CatalogosService
    this.catalogosService.getAll().subscribe(res => {
      this.perfiles = res.Perfiles;
      this.perfilesFiltrados = res.Perfiles;
    });

    // Autocomplete básico
    this.form.get('perfil')!.valueChanges.subscribe(value => {
      const val = value?.toLowerCase() || '';
      this.perfilesFiltrados = this.perfiles.filter(p =>
        p.FUNCION.toLowerCase().includes(val) || p.CLAVE.toLowerCase().includes(val)
      );
    });
  }

  agregarPerfil(): void {
    const clavePerfil = this.form.value.perfil;

    const perfilSeleccionado = this.perfiles.find(p =>
      p.CLAVE.toLowerCase() === clavePerfil.toLowerCase() ||
      p.FUNCION.toLowerCase() === clavePerfil.toLowerCase()
    );

    if (perfilSeleccionado && !this.perfilesAgregados.some(p => p.ID === perfilSeleccionado.ID)) {
      this.perfilesAgregados.push(perfilSeleccionado);
      this.addPerfil.emit();
      this.form.reset();
    }
  }

  eliminarPerfil(index: number): void {
    this.perfilesAgregados.splice(index, 1);
    this.removePerfil.emit(index);
  }
}
