import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolicitudesService, Solicitud } from '../../services/solicitudes.services';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
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
    this.svc.getPage(page).subscribe({
      next: res => {
        this.lista = res.items;
        this.totalPages = res.totalPages;
        this.currentPage = page;
        this.buildPages();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
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
