import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolicitudesService, Solicitud } from '../../services/solicitudes.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe
  ],
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

  constructor(
    private svc: SolicitudesService,
    private usuarioSvc: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }
  formatDate(item: Solicitud): Date {
    // Nota: mes - 1 porque en JS los meses van de 0 (enero) a 11 (diciembre)
    return new Date(item.año, item.mes - 1, item.dia);
  }
  private buildPages(): void {
    const pages: (number|'...')[] = [];
    if (this.currentPage > 1) {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
    }
    const start = Math.max(2, this.currentPage - 1);
    const end   = Math.min(this.totalPages - 1, this.currentPage + 1);
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
      next: res => {
        this.lista       = res.items;
        this.totalPages  = res.totalPages;
        this.currentPage = page;
        this.buildPages();
        this.isLoading   = false;
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


  download(item: Solicitud): void {
    this.overlayLoading = true;
    this.svc.downloadPdf(item.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solicitud-${item.folio}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      complete: () => this.overlayLoading = false,
      error: () => this.overlayLoading = false
    });
  }

  irAUsuario(): void {
    this.router.navigate(['/cargausuario']);
  }
}
