import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolicitudesService, Solicitud, PageResult } from '../../services/solicitudes.service';
import { UsuarioService } from '../../services/usuario.service';
import { CedulaModel, PdfService } from '../../services/pdf.service';
import { CatalogosService } from '../../services/catalogos.service';

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
  itemsPerPage = 10;
  entidadesMap      = new Map<number,string>();
  municipiosMap     = new Map<number,string>();
  institucionesMap  = new Map<number,string>();
  dependenciasMap   = new Map<number,string>();
  corporacionesMap  = new Map<number,string>();
  areasMap          = new Map<number,string>();
  entidades2Map     = new Map<number,string>();
  municipios2Map    = new Map<number,string>();
  corporaciones2Map = new Map<number,string>();
  constructor(
    private svc: SolicitudesService,
    private usuarioSvc: UsuarioService,
    private router: Router,
    private catalogos: CatalogosService,
    private pdfSvc: PdfService
  ) {}

  ngOnInit(): void {
     // 1) carga catálogos
    this.catalogos.getAll().subscribe(res => {
      // Entidades y municipios vienen juntos en res.Entidades
        console.log('Respuesta de catalogos:', res);
res.Entidades.forEach((e: any) => {
    const id      = e.ID ?? e.id;
    const nombre  = e.NOMBRE ?? e.nombre;
    const fkPadre = e.FK_PADRE ?? e.fk_padre;

    if (fkPadre == null) {
      this.entidadesMap.set(Number(id), nombre);
    } else {
      this.municipiosMap.set(Number(id), nombre);
    }
  });
      // Estructura organizacional: instituciones, dependencias, corporaciones, áreas
      res.Estructura.forEach(x => {
        switch (x.tipo) {
          case 'INSTITUCION':
            this.institucionesMap.set(x.id, x.nombre); break;
          case 'DEPENDENCIA':
            this.dependenciasMap.set(x.id, x.nombre); break;
          case 'CORPORACION':
            this.corporacionesMap.set(x.id, x.nombre); break;
          case 'AREA':
            this.areasMap.set(x.id, x.nombre); break;
        }
      });
      // Para el bloque 2 (si es mismo catálogo de Entidades/Municipios)
      // reutilizamos los mismos maps:
      this.entidades2Map = this.entidadesMap;
      this.municipios2Map = this.municipiosMap;
      this.corporaciones2Map = this.corporacionesMap;
    });
    this.loadPage(1);
  }

  /**
   * Genera objeto CedulaModel y descarga el PDF de forma secuencial,
   * asegurando que isLoadingPdf se restablezca incluso tras error.
   */

  /** Helper para normalizar y construir el modelo que usa PdfService */
private buildPdfCedulaModel(item: Solicitud): CedulaModel {
  const safeStr = (v: any): string | null => {
    if (v === null || v === undefined) return null;
    return String(v);
  };
  const toNumberOrNull = (v: any): number | null => {
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  return {
    fill1: safeStr(item.fill1),
    folio: safeStr(item.folio),
    cuentaUsuario: safeStr(item.cuentaUsuario),
    correoElectronico: safeStr(item.correoElectronico),
    telefono: safeStr(item.telefono),
    apellidoPaterno: safeStr(item.apellidoPaterno),
    apellidoMaterno: safeStr(item.apellidoMaterno),
    nombre: safeStr(item.nombre),
    nombre2: safeStr((item as any).nombre2),
    rfc: safeStr((item as any).rfc),
    cuip: safeStr((item as any).cuip),
    curp: safeStr((item as any).curp),
    tipoUsuario: toNumberOrNull(item.tipoUsuario),
    entidad: toNumberOrNull(item.entidad),
    municipio: toNumberOrNull(item.municipio),
    institucion: toNumberOrNull(item.institucion),
    corporacion: toNumberOrNull(item.corporacion),
    area: toNumberOrNull(item.area),
    cargo: safeStr(item.cargo),
    funciones: safeStr(item.funciones),
    funciones2: safeStr((item as any).funciones2),
    pais: safeStr(item.pais),
    entidad2: toNumberOrNull((item as any).entidad2),
    municipio2: toNumberOrNull((item as any).municipio2),
    corporacion2: toNumberOrNull((item as any).corporacion2),
    consultaTextos: (item as any).consultaTextos || {},
    modulosOperacion: (item as any).modulosOperacion || {},
    checkBox1: (item as any).checkBox1 ?? false,
    checkBox2: (item as any).checkBox2 ?? false,
    checkBox3: (item as any).checkBox3 ?? false,
    checkBox4: (item as any).checkBox4 ?? false,
    checkBox5: (item as any).checkBox5 ?? false,
    // Nombres resueltos de los catálogos (fallback a cadena vacía)
    entidadNombre: this.entidadesMap.get(item.entidad) || '',
    municipioNombre: this.municipiosMap.get(item.municipio) || '',
    institucionNombre: this.institucionesMap.get(item.institucion) || '',
    dependenciaNombre: this.dependenciasMap.get(item.dependencia) || '',
    corporacionNombre: this.corporacionesMap.get(item.corporacion) || '',
    areaNombre: this.areasMap.get(item.area) || '',
    entidad2Nombre: this.entidades2Map.get((item as any).entidad2) || '',
    municipio2Nombre: this.municipios2Map.get((item as any).municipio2) || '',
    corporacion2Nombre: this.corporaciones2Map.get((item as any).corporacion2) || '',
    nombreFirmaUsuario: (item as any).nombreFirmaUsuario || null,
    nombreFirmaResponsable: (item as any).nombreFirmaResponsable || null,
    nombreFirmaEnlace: (item as any).nombreFirmaEnlace || null,
  };
}


async descargarPdf(item: Solicitud): Promise<void> {
  this.isLoadingPdf = true;
  try {
    const datos = this.buildPdfCedulaModel(item);
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
  const total = this.totalPages;
  const current = this.currentPage;

  // 1) Siempre la primera
  pages.push(1);

  // 2) Si hay un hueco grande antes de la “ventana”…
  if (current - 1 > 2) {
    pages.push('...');
  }

  // 3) Ventana de 3 páginas centrada en la actual (sin pasarse de los límites)
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // 4) Si hay hueco grande tras la “ventana”…
  if (current + 1 < total - 1) {
    pages.push('...');
  }

  // 5) Siempre la última (si no es la misma que la primera)
  if (total > 1) {
    pages.push(total);
  }

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
    getEntidadName(id: number): string {
    return this.entidadesMap.get(id) ?? '';
  }
  getMunicipioName(id: number): string {
    return this.municipiosMap.get(id) ?? '';
  }
  getInstitucionName(id: number): string {
    return this.institucionesMap.get(id) ?? '';
  }
  getDependenciaName(id: number): string {
    return this.dependenciasMap.get(id) ?? '';
  }
  getCorporacionName(id: number): string {
    return this.corporacionesMap.get(id) ?? '';
  }
  getAreaName(id: number): string {
    return this.areasMap.get(id) ?? '';
  }
  getEntidad2Name(id: number): string {
    return this.entidades2Map.get(id) ?? '';
  }
  getMunicipio2Name(id: number): string {
    return this.municipios2Map.get(id) ?? '';
  }
  getCorporacion2Name(id: number): string {
    return this.corporaciones2Map.get(id) ?? '';
  }
}
