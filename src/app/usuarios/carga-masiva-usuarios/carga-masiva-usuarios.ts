import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
selector: 'app-carga-masiva-usuarios',
standalone: true,
imports: [CommonModule, FormsModule],
templateUrl: './carga-masiva-usuarios.html',
styleUrls: ['./carga-masiva-usuarios.scss']
})
export class CargaMasivaUsuariosComponent implements OnInit {
// Loader y redirección
loading = true;
shouldRedirect = false;

// Sesión y menú de usuario
isLoggedIn = false;
session = { nombreCompleto: '', rol: '', permiso: '', entidad: '' };
menuOpen = false;

// Listado de solicitudes y paginación
listaSolicitud: any[] = [];
currentPage = 1;
itemsPerPage = 10;
get listaSolicitudPaginated(): any[] {
const start = (this.currentPage - 1) * this.itemsPerPage;
return this.listaSolicitud.slice(start, start + this.itemsPerPage);
}
get totalPages(): number {
return Math.ceil(this.listaSolicitud.length / this.itemsPerPage) || 0;
}
get pages(): number[] {
return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

// Selección de archivo y overlays
selectedFile?: File;
overlayLoaderVisible = false;
carmasivMostrandoLoader = false;
carmasivProgreso = 0;

// Toast notifications
showToast = false;
isHiding = false;
toastMessage = '';
toastColor = '';

constructor(private router: Router) {}

ngOnInit(): void {
// Simular carga inicial y verificar sesión
setTimeout(() => {
this.loading = false;
this.isLoggedIn = true;
}, 500);
}

// Usuario
toggleUserMenu(): void {
this.menuOpen = !this.menuOpen;
}

// Paginación
cambiarPagina(page: number): void {
if (page >= 1 && page <= this.totalPages) {
this.currentPage = page;
}
}

// File Picker
handleFileSelection(event: Event): void {
const input = event.target as HTMLInputElement;
if (input.files && input.files.length > 0) {
this.selectedFile = input.files[0];
}
}
openFilePicker(): void {
document.getElementById('fileInput')?.click();
}

// Acciones de celda
downloadPDF(cedula: any): void {
console.log('Download PDF for', cedula);
}
irIndividual(cedula: any): void {
console.log('Navigate to individual', cedula);
}

// Carga masiva
descargarPDFsMasivos(): void {
console.log('Descargar PDFs Masivos');
}
sendSolicitudMasiva(): void {
console.log('Enviar Solicitud Masiva');
}

// Toast
private showToastMessage(message: string, color: string): void {
this.toastMessage = message;
this.toastColor = color;
this.showToast = true;
this.isHiding = false;
setTimeout(() => {
this.isHiding = true;
setTimeout(() => this.showToast = false, 600);
}, 3000);
}
}