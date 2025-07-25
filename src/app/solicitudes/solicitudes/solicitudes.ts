import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolicitudesService, Solicitud, PageResult } from '../../services/solicitudes.service';
import { UsuarioService } from '../../services/usuario.service';
import { CedulaModel, PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './solicitudes.html',
  styleUrls: ['./solicitudes.scss']
})
export class SolicitudesComponent implements OnInit {
  lista: Solicitud[] = [];
  currentPage = 1;
  totalPages = 1;
  pages: (number | '...')[] = [];
  isLoading = true;
  overlayLoading = false;
  isLoadingPdf = false;

  constructor(
    private svc: SolicitudesService,
    private usuarioSvc: UsuarioService,
    private router: Router,
    private pdfSvc: PdfService
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  /**
   * Genera objeto CedulaModel y descarga el PDF de forma secuencial,
   * asegurando que isLoadingPdf se restablezca incluso tras error.
   */
  async descargarPdf(item: Solicitud): Promise<void> {
    this.isLoadingPdf = true;
    try {
      const datos: CedulaModel = {
        fill1: item.fill1,
        folio: item.folio,
        cuentaUsuario: item.cuentaUsuario,
        correoElectronico: item.correoElectronico,
        telefono: item.telefono,
        apellidoPaterno: item.apellidoPaterno,
        apellidoMaterno: item.apellidoMaterno,
        nombre: item.nombre,
        nombre2: (item as any).nombre2,
        rfc: (item as any).rfc,
        cuip: (item as any).cuip,
        curp: (item as any).curp,
        tipoUsuario: item.tipoUsuario,
        entidad: item.entidad,
        municipio: item.municipio,
        institucion: item.institucion,
        corporacion: item.corporacion,
        area: item.area,
        cargo: item.cargo,
        funciones: item.funciones,
        funciones2: (item as any).funciones2,
        pais: item.pais,
        entidad2: (item as any).entidad2,
        municipio2: (item as any).municipio2,
        corporacion2: (item as any).corporacion2,
        consultaTextos: (item as any).consultaTextos,
        modulosOperacion: (item as any).modulosOperacion,
        checkBox1: (item as any).checkBox1,
        checkBox2: (item as any).checkBox2,
        checkBox3: (item as any).checkBox3,
        checkBox4: (item as any).checkBox4,
        checkBox5: (item as any).checkBox5
      };
      await this.pdfSvc.generarYDescargar(datos);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      this.isLoadingPdf = false;
    }
  }

  formatDate(item: Solicitud): Date {
    return new Date(item.año, item.mes - 1, item.dia);
  }

  private buildPages(): void {
    const pages: (number | '...')[] = [];
    if (this.currentPage > 1) {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
    }
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (this.currentPage < this.totalPages - 2) pages.push('...');
    if (this.currentPage < this.totalPages) pages.push(this.totalPages);
    this.pages = pages;
  }

  loadPage(page: number): void {
    this.isLoading = true;
    const uid = this.usuarioSvc.getUserId();
    if (uid === null) {
      console.error('No hay userId en localStorage');
      this.isLoading = false;
      return;
    }

    this.svc.getPage(page, uid).subscribe({
      next: (res: PageResult<Solicitud>) => {
        this.lista = res.items;
        this.totalPages = res.totalPages;
        this.currentPage = page;
        this.buildPages();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error al cargar solicitudes:', err);
        this.isLoading = false;
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) this.loadPage(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.loadPage(this.currentPage + 1);
  }

  goToPage(page: number | '...'): void {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.loadPage(page);
    }
  }

  irAUsuario(): void {
    this.router.navigate(['/cargausuario']);
  }
}
