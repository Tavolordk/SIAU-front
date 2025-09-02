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
  entidadesMap = new Map<number, string>();
  municipiosMap = new Map<number, string>();
  institucionesMap = new Map<number, string>();
  dependenciasMap = new Map<number, string>();
  corporacionesMap = new Map<number, string>();
  areasMap = new Map<number, string>();
  entidades2Map = new Map<number, string>();
  municipios2Map = new Map<number, string>();
  corporaciones2Map = new Map<number, string>();
  constructor(
    private svc: SolicitudesService,
    private usuarioSvc: UsuarioService,
    private router: Router,
    private catalogos: CatalogosService,
    private pdfSvc: PdfService
  ) { }

  ngOnInit(): void {
    // 1) carga catálogos
    this.catalogos.getAll().subscribe(res => {
      // Entidades y municipios vienen juntos en res.Entidades
      console.log('Respuesta de catalogos:', res);
      res.Entidades.forEach((e: any) => {
        const id = e.ID ?? e.id;
        const nombre = e.NOMBRE ?? e.nombre;
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
private async buildPdfCedulaModelAsync(item: Solicitud): Promise<CedulaModel> {
  await this.catalogos.ensureReady(); // <- clave para evitar carreras

  const n = this.toNumberOrNull;
  const entidadId     = n(item.entidad);
  const municipioId   = n(item.municipio);
  const institucionId = n(item.institucion);
  const corporacionId = n(item.corporacion);
  const areaId        = n(item.area);
  const entidad2Id    = n((item as any).entidad2);
  const municipio2Id  = n((item as any).municipio2);
  const corporacion2Id= n((item as any).corporacion2);

  return {
    // ---- crudos / ids ----
    fill1: String(item.fill1 ?? null),
    folio: String(item.folio ?? null),
    cuentaUsuario: String(item.cuentaUsuario ?? null),
    correoElectronico: String(item.correoElectronico ?? null),
    telefono: String(item.telefono ?? null),
    apellidoPaterno: String(item.apellidoPaterno ?? null),
    apellidoMaterno: String(item.apellidoMaterno ?? null),
    nombre: String(item.nombre ?? null),
    nombre2: String((item as any).nombre2 ?? null),
    rfc: String((item as any).rfc ?? null),
    cuip: String((item as any).cuip ?? null),
    curp: String((item as any).curp ?? null),
    tipoUsuario: n(item.tipoUsuario),
    entidad: entidadId,
    municipio: municipioId,
    institucion: institucionId,
    corporacion: corporacionId,
    area: areaId,
    cargo: String(item.cargo ?? null),
    funciones: String(item.funciones ?? null),
    funciones2: String((item as any).funciones2 ?? null),
    pais: String(item.pais ?? null),
    entidad2: entidad2Id,
    municipio2: municipio2Id,
    corporacion2: corporacion2Id,
    consultaTextos: (item as any).consultaTextos || {},
    modulosOperacion: (item as any).modulosOperacion || {},
    checkBox1: (item as any).checkBox1 ?? false,
    checkBox2: (item as any).checkBox2 ?? false,
    checkBox3: (item as any).checkBox3 ?? false,
    checkBox4: (item as any).checkBox4 ?? false,
    checkBox5: (item as any).checkBox5 ?? false,

    // ---- nombres vía CatalogosService ----
    entidadNombre:     entidadId     != null ? (this.catalogos.getEntidadNameById(entidadId)     ?? '') : '',
    municipioNombre:   municipioId   != null ? (this.catalogos.getMunicipioNameById(municipioId) ?? '') : '',
    institucionNombre: institucionId != null ? (this.catalogos.getInstitucionNameById(institucionId) ?? '') : '',
    dependenciaNombre: ((): string => {
      const depId = this.toNumberOrNull((item as any).dependencia);
      return depId != null ? (this.catalogos.getDependenciaNameById(depId) ?? '') : '';
    })(),
    corporacionNombre: corporacionId != null ? (this.catalogos.getCorporacionNameById(corporacionId) ?? '') : '',
    areaNombre:        areaId        != null ? (this.catalogos.getAreaNameById(areaId) ?? '') : '',
    entidad2Nombre:    entidad2Id    != null ? (this.catalogos.getEntidadNameById(entidad2Id) ?? '') : '',
    municipio2Nombre:  municipio2Id  != null ? (this.catalogos.getMunicipioNameById(municipio2Id) ?? '') : '',
    corporacion2Nombre: corporacion2Id != null ? (this.catalogos.getCorporacionNameById(corporacion2Id) ?? '') : '',

    nombreFirmaUsuario:       (item as any).nombreFirmaUsuario ?? null,
    nombreFirmaResponsable:   (item as any).nombreFirmaResponsable ?? null,
    nombreFirmaEnlace:        (item as any).nombreFirmaEnlace ?? null,
  };
}


async descargarPdf(item: Solicitud): Promise<void> {
  this.isLoadingPdf = true;
  try {
    const datos = await this.buildPdfCedulaModelAsync(item);
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
    const end = Math.min(total - 1, current + 1);
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
  private toNumberOrNull = (v: any): number | null => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Getters que toleran string/null y fuerzan a número
  getMunicipioName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.municipiosMap.get(n) ?? '';
  }
  getEntidadName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.entidadesMap.get(n) ?? '';
  }

  getInstitucionName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.institucionesMap.get(n) ?? '';
  }
  getDependenciaName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.dependenciasMap.get(n) ?? '';
  }
  getCorporacionName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.corporacionesMap.get(n) ?? '';
  }
  getAreaName(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.areasMap.get(n) ?? '';
  }
  getEntidad2Name(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.entidades2Map.get(n) ?? '';
  }
  getMunicipio2Name(id: number | string | null | undefined): string {
    if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.municipios2Map.get(n) ?? '';
  }
  getCorporacion2Name(id: number | string | null | undefined): string {
        if (id == null) return '';
    const n = Number(id);
    if (!Number.isFinite(n)) return '';
    return this.corporaciones2Map.get(n) ?? '';
  }
}
