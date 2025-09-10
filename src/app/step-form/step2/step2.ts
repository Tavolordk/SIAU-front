import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CatalogosService, CatPerfilDto } from '../../services/catalogos.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
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

  // Catálogo y listas
  @Input() perfiles: CatPerfilDto[] = [];
  perfilesDisponibles: CatPerfilDto[] = []; // 👈 fuente del ng-select
  perfilesAgregados: CatPerfilDto[] = [];

  // Placeholder dinámico
  perfilPlaceholder = 'Ej: 3101 SUPERVISOR IPH';

  constructor(
    private fb: FormBuilder,
    private catalogosService: CatalogosService
  ) {}

  ngOnInit(): void {
    if (!this.form) {
      this.form = this.fb.group({
        perfil: [null, Validators.required] // guarda OBJETO, no string
      });
    }

    this.catalogosService.getAll().subscribe(res => {
      this.perfiles = res.Perfiles ?? [];
      this.perfilesDisponibles = [...this.perfiles];
    });

  }

  // Búsqueda en ng-select
  searchPerfil = (term: string, item: CatPerfilDto) =>
    (item.clave + ' ' + item.funcion).toLowerCase().includes((term || '').toLowerCase());

  onPerfilSelected(item: CatPerfilDto | null) {
    if (item) {
      this.perfilPlaceholder = `${item.clave} - ${item.funcion}`;
    }
  }

  agregarPerfil(): void {
    const p = this.form.value.perfil as CatPerfilDto | null;
    if (!p) return;

    if (!this.perfilesAgregados.some(x => x.id === p.id)) {
      this.perfilesAgregados.push(p);
      // Quita del select
      this.perfilesDisponibles = this.perfilesDisponibles.filter(x => x.id !== p.id);
      this.addPerfil.emit();
    }

    // Limpia el control (placeholder ya quedó con el texto seleccionado)
    this.form.patchValue({ perfil: null });
  }

  eliminarPerfil(index: number): void {
    const p = this.perfilesAgregados[index];
    this.perfilesAgregados.splice(index, 1);
    // Regresa al select y ordena por clave (opcional)
    this.perfilesDisponibles = [...this.perfilesDisponibles, p]
      .sort((a, b) => a.clave.localeCompare(b.clave));
    this.removePerfil.emit(index);
  }
}
