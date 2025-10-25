import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faCommentDots, faFileLines, faEye } from '@fortawesome/free-solid-svg-icons';
import { PaginationComponent } from '../../shared/pagination/pagination';
import { SiauShellBusService } from '../../siau-shell/siau-shell-bus.service';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { LoginAdminBusquedaFullService } from '../../services/login-admin-busqueda-full.service';
import {
  AdminBusquedaFullRequest
} from '../../models/admin-busqueda-full-request.model';
import { AdminBusquedaFullItem, AdminBusquedaFullResponse } from '../../models/admin-busqueda-full-response.model';
import { Router } from '@angular/router';

type Row = {
  id: number;
  folio: string;
  fecha: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  usuario: string;
  tipoSolicitud: string;
  tipoInstitucion: string;
  entidadMunicipio: string;
  instDepCorp: string;
  rnpsp: string;
  sau: string;
  resultadoEccc: string;
  estatusTexto: string;
  estatusClase: string;
};

@Component({
  selector: 'app-consultar-cedulas',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, PaginationComponent, ReactiveFormsModule],
  templateUrl: './consultar-cedulas.html',
  styleUrls: ['./consultar-cedulas.scss']
})
export class ConsultarCedulasComponent implements OnInit {

  constructor(private shellBus: SiauShellBusService, private route:Router) {}
  nuevaSolicitud() {
    this.route.navigate(['/stepform']);
  }
  private fb = inject(FormBuilder);
  private svc = inject(LoginAdminBusquedaFullService);

  // UI / icons
  pageSize = 10;
  icBars = faBars;
  icons = {
    chevronDown: faChevronDown,
    comment: faCommentDots,
    file: faFileLines,
    eye: faEye,
  };

  // dropdown filtros
  open: 'personal' | 'solicitud' | 'institucional' | null = null;

  // tabla
  rows: Row[] = [];
  pageRows: Row[] = [];

  // estados
  loading = false;
  error: string | null = null;
  total = 0;

  // ====== Filtros (reactivos) ======
  form = this.fb.group({
    // Información Personal
    cuenta_codigo: [''],
    nombres: [''],
    primer_apellido: [''],
    segundo_apellido: [''],
    curp: [''],
    rfc: [''],

    // Información de Solicitud
    fecha_desde: [''],
    fecha_hasta: [''],
    folio: [''],
    tipo_tramite: [''],
    estatus: [''],

    // Información Institucional/Estatal
    tipo_institucion: [''],
    entidad: [''],
    municipio: [''],
    institucion: [''],
    dependencia: [''],
    corporacion: [''],
    area: [''],

    // texto libre
    busca: ['']
  });

  ngOnInit(): void {
    // Si quieres precargar la primera búsqueda:
    this.onBuscar();
  }

  // dropdowns filtros
  toggleDropdown(which: 'personal' | 'solicitud' | 'institucional', ev: MouseEvent) {
    ev.stopPropagation();
    this.open = (this.open === which) ? null : which;
  }
  @HostListener('document:click') closeAll() { this.open = null; }

  // acciones tabla
  onComment(row?: any) { console.log('comentarios', row); }
  onDocs(row?: any)    { console.log('documentos', row); }
  onView(row?: any)    { console.log('ver', row); }

  // acciones filtros/pie tabla
  onBuscar()  {
    this.loading = true;
    this.error = null;

    const body = this.buildRequest();
    // NOTA: aquí paginamos en cliente con lo que devuelva el backend.
    // Si tu backend trae muchos, puedes limitar (p. ej. body.limit = 500).
    this.svc.buscar(body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp: AdminBusquedaFullResponse) => {
          this.total = resp.total ?? 0;
          const items = resp.items ?? [];
          this.rows = items.map(this.mapItemToRow);
          // primer page para que tu app-pagination tenga datos de arranque
          this.pageRows = this.rows.slice(0, this.pageSize);
        },
        error: (err: { status?: number; message?: string }) => {
          this.error = err?.message || 'Error al cargar resultados';
          this.rows = [];
          this.pageRows = [];
          this.total = 0;
        }
      });
  }

  onLimpiar() {
    this.form.reset({
      cuenta_codigo: '',
      nombres: '',
      primer_apellido: '',
      segundo_apellido: '',
      curp: '',
      rfc: '',
      fecha_desde: '',
      fecha_hasta: '',
      folio: '',
      tipo_tramite: '',
      estatus: '',
      tipo_institucion: '',
      entidad: '',
      municipio: '',
      institucion: '',
      dependencia: '',
      corporacion: '',
      area: '',
      busca: ''
    });
    this.onBuscar();
  }

  // Para app-pagination (paginación cliente)
  trackByFolio = (_: number, r: Row) => r.folio;

  // ====== helpers ======
  private toNull = (s?: string | null) =>
    s === undefined || s === null || String(s).trim() === '' ? null : String(s).trim();

  private buildRequest(): AdminBusquedaFullRequest {
    const v = this.form.getRawValue();

    // Puedes forzar el usuario logueado aquí si aplica:
    // const cuenta = localStorage.getItem('cuenta_codigo') || v.cuenta_codigo || null;

    return {
      cuenta_codigo: this.toNull(v.cuenta_codigo),
      nombres: this.toNull(v.nombres),
      primer_apellido: this.toNull(v.primer_apellido),
      segundo_apellido: this.toNull(v.segundo_apellido),
      curp: this.toNull(v.curp),
      rfc: this.toNull(v.rfc),

      folio: this.toNull(v.folio),
      tipo_tramite: this.toNull(v.tipo_tramite),
      estatus: this.toNull(v.estatus),
      fecha_desde: this.toNull(v.fecha_desde),
      fecha_hasta: this.toNull(v.fecha_hasta),

      tipo_institucion: this.toNull(v.tipo_institucion),
      entidad: this.toNull(v.entidad),
      municipio: this.toNull(v.municipio),
      institucion: this.toNull(v.institucion),
      dependencia: this.toNull(v.dependencia),
      corporacion: this.toNull(v.corporacion),
      area: this.toNull(v.area),

      busca: this.toNull(v.busca),

      // Como la tabla usa paginación cliente, pedimos "bastantes" filas.
      // Ajusta si tu endpoint lo requiere.
      limit: 500,
      offset: 0
    };
  }

  private mapItemToRow = (it: AdminBusquedaFullItem): Row => {
    const entidadMunicipio = [
      this.toNull(it.entidad) ? `Entidad: ${it.entidad}` : null,
      this.toNull(it.municipio) ? `municipio: ${it.municipio}` : null
    ].filter(Boolean).join(', ');

    const instDepCorp = [
      this.toNull(it.institucion) ? `Institución: ${it.institucion}` : null,
      this.toNull(it.dependencia) ? `dependencia: ${it.dependencia}` : null,
      this.toNull(it.corporacion) ? `corporación: ${it.corporacion}` : null
    ].filter(Boolean).join(', ');

    const estatusTexto = this.toNull(it.estatus) ?? 'Pendiente';
    const estatusClase = this.statusClass(estatusTexto);

    return {
      id: it.id,
      folio: it.folio || '-----',
      fecha: it.fecha || '-----',

      nombres: it.nombres || '-----',
      primerApellido: it.primer_apellido || '-----',
      segundoApellido: this.toNull(it.segundo_apellido) ?? '-----',

      usuario: this.toNull(it.cuenta_codigo) ?? '-----',
      tipoSolicitud: this.toNull(it.tipo_solicitud) ?? '-----',
      tipoInstitucion: this.toNull(it.tipo_institucion) ?? '-----',

      entidadMunicipio: entidadMunicipio || '-----',
      instDepCorp: instDepCorp || '-----',

      rnpsp: '-----',            // tu API no los trae; deja placeholder
      sau: '-----',
      resultadoEccc: '-----',

      estatusTexto,
      estatusClase
    };
  };

  private statusClass(s: string): string {
    const t = s.toLowerCase();
    if (t.includes('aprob')) return 'status-aprobada';
    if (t.includes('rechaz')) return 'status-rechazada';
    if (t.includes('cancel')) return 'status-cancelada';
    if (t.includes('espera') || t.includes('en espera')) return 'status-espera';
    if (t.includes('pend')) return 'status-pendiente';
    if (t.includes('valid')) return 'status-aprobada'; // ajusta si tienes clase específica
    if (t.includes('recib')) return 'status-pendiente';
    return 'status-pendiente';
  }

  // toolbar (sidebar shell)
  onToggleSidebar() {
    const anyBus = this.shellBus as any;
    if (typeof anyBus.requestMinimize === 'function') {
      anyBus.requestMinimize(); return;
    }
    if (typeof anyBus.requestToggle === 'function') {
      anyBus.requestToggle('minimize'); return;
    }
    window.dispatchEvent(new CustomEvent('siau-shell:sidebar', { detail: 'minimize' }));
  }

  // paginación cliente: el <app-pagination> te emite los renglones de la página
  // y acá solo los pintamos en la tabla.
  // (Ya lo traes en el template con (pageItemsChange)="pageRows = $event")
  onAprobar() {
  // TODO: aquí iría tu flujo real de aprobación
  console.log('Aprobar', this.pageRows);
}
}
