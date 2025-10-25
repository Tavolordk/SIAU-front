import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCommentDots, faTrash } from '@fortawesome/free-solid-svg-icons';
import { LoginCedulasPorRolService } from '../../services/login-cedulas-por-rol.service';
import { CedulasPorRolRequest } from '../../models/cedulas-por-rol-request.model';
import { CedulasPorRolItem, CedulasPorRolResponse } from '../../models/cedulas-por-rol-response.model';

// Para embedir el detalle:
import { RegistroCedulaComponent } from '../../features/registro-cedula/registro-cedula'; 

type Estatus = 'Enviada'|'Validada'|'Rechazada'|'Sin estatus';
type Row = {
  id: number;
  folio: string;
  tipo: string;
  fecha: string;     // YYYY-MM-DD o '-----'
  estatus: Estatus;
};

@Component({
  selector: 'app-mis-cedulas',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, RegistroCedulaComponent, FontAwesomeModule],
  templateUrl: './mis-cedulas.html',
  styleUrls: ['./mis-cedulas.scss']
})
export class MisCedulasComponent implements OnInit {
    icons = {
    comment: faCommentDots,
    trash: faTrash,
  };
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private svc = inject(LoginCedulasPorRolService);

  // Tabla
  rows: Row[] = [];
  total = 0;

  // Paginación
  limit = 10;
  offset = 0;
  readonly pageSizes = [10, 25, 50, 100];

  // Estados UI
  loading = false;
  error: string | null = null;

  // Estado para mostrar/ocultar detalle
  showDetalle = false;
  selectedFolio: string | null = null;

  // Filtros
  readonly estatusOpts: (Estatus | '')[] = ['', 'Enviada', 'Validada', 'Rechazada', 'Sin estatus'];
  readonly tiposTramite = ['', 'Reactivar cuenta', 'Modificación de perfil/adscripción', 'Amplificación de perfiles'];

  form = this.fb.group({
    busca: [''],
    estatus: [''],
    tipo_tramite: [''],
    fecha_desde: [''],
    fecha_hasta: ['']
  });

  ngOnInit(): void {
    this.fetchPage(0);
  }

  // Acciones UI
  nuevaSolicitud() {
    this.router.navigate(['/registro-enlace']);
  }

  revisar(row: Row) {
    // Mostrar componente de detalle y pasar el folio
    this.selectedFolio = row.folio;
    this.showDetalle = true; // al mostrarse, RegistroCedulaComponent hace la consulta por folio
  }

  cerrarDetalle() {
    this.showDetalle = false;
    this.selectedFolio = null;
    // Si quieres refrescar la lista después de validar/rechazar:
    this.fetchPage(this.offset);
  }

  onDetalleValidado(_payload: any) {
    // refresca listado o actualiza la fila si lo deseas
    this.cerrarDetalle();
  }

  onDetalleRechazado(_payload: any) {
    this.cerrarDetalle();
  }

  onDetalleGuardado(_payload: any) {
    // opcional
  }

comentarios(row: Row) {
  // Abre la pantalla de comentarios y pasa el folio para que allí se use el servicio
  this.router.navigate(['/comentarios'], { queryParams: { folio: row.folio } });
}


  eliminar(row: Row) {
    console.log('Eliminar', row.folio);
  }

  buscar() {
    this.fetchPage(0);
  }

  limpiar() {
    this.form.reset({
      busca: '',
      estatus: '',
      tipo_tramite: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    this.fetchPage(0);
  }

  setLimit(value: number) {
    this.limit = value;
    this.fetchPage(0);
  }

  prevPage() {
    if (this.offset > 0) this.fetchPage(Math.max(0, this.offset - this.limit));
  }

  nextPage() {
    if (this.offset + this.limit < this.total) this.fetchPage(this.offset + this.limit);
  }

  pageIndex(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  trackById = (_: number, r: Row) => r.id;

  // ----------- Privados -----------
  private fetchPage(offset: number) {
    this.offset = offset;
    this.loading = true;
    this.error = null;

    const body = this.buildRequest();
    this.svc.listar(body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp: CedulasPorRolResponse) => {
          this.total = resp.total ?? 0;
          this.rows = (resp.items ?? []).map(this.mapItemToRow);
        },
        error: (err: { status?: number; message?: string }) => {
          this.error = err?.message || 'Error al cargar las cédulas';
          this.rows = [];
          this.total = 0;
        }
      });
  }

  private buildRequest(): CedulasPorRolRequest {
    const v = this.form.getRawValue();

    const cuenta_codigo = localStorage.getItem('cuenta_codigo') || 'U876543';
    const tipo_usuario  = localStorage.getItem('tipo_usuario') || 'ADMINISTRADOR';

    const toNull = (s: string | null | undefined) =>
      s === undefined || s === null || s.trim() === '' ? null : s;

    return {
      cuenta_codigo,
      tipo_usuario,
      busca: toNull(v.busca || ''),
      estatus: toNull(v.estatus || ''),
      tipo_tramite: toNull(v.tipo_tramite || ''),
      fecha_desde: toNull(v.fecha_desde || ''),
      fecha_hasta: toNull(v.fecha_hasta || ''),
      limit: this.limit,
      offset: this.offset
    };
  }

  private mapItemToRow = (it: CedulasPorRolItem): Row => {
    const est: Estatus =
      it.estatus === 'Enviada' || it.estatus === 'Validada' || it.estatus === 'Rechazada'
        ? it.estatus
        : 'Sin estatus';

    return {
      id: it.id,
      folio: it.folio || '-----',
      tipo: it.tipo_solicitud || '-----',
      fecha: it.fecha || '-----',
      estatus: est
    };
  };

  onLimitChange(e: Event) {
    const value = Number((e.target as HTMLSelectElement).value);
    this.setLimit(value);
  }
}
