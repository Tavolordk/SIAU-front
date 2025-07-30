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
      res.Entidades.forEach(e => {
        if (e.FK_PADRE === null) {
          this.entidadesMap.set(e.ID, e.NOMBRE);
        } else if (e.FK_PADRE !== null) {
          this.municipiosMap.set(e.ID, e.NOMBRE);
        }
      });
      // Estructura organizacional: instituciones, dependencias, corporaciones, áreas
      res.Estructura.forEach(x => {
        switch (x.TIPO) {
          case 'INSTITUCION':
            this.institucionesMap.set(x.ID, x.NOMBRE); break;
          case 'DEPENDENCIA':
            this.dependenciasMap.set(x.ID, x.NOMBRE); break;
          case 'CORPORACION':
            this.corporacionesMap.set(x.ID, x.NOMBRE); break;
          case 'AREA':
            this.areasMap.set(x.ID, x.NOMBRE); break;
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
        checkBox5: (item as any).checkBox5,
      entidadNombre:      this.entidadesMap.get(item.entidad)       || '',
      municipioNombre:    this.municipiosMap.get(item.municipio)    || '',
      institucionNombre:  this.institucionesMap.get(item.institucion) || '',
      dependenciaNombre:  this.dependenciasMap.get(item.dependencia) || '',
      corporacionNombre:  this.corporacionesMap.get(item.corporacion) || '',
      areaNombre:         this.areasMap.get(item.area)              || '',
      entidad2Nombre:     this.entidades2Map.get(item.entidad2)     || '',
      municipio2Nombre:   this.municipios2Map.get(item.municipio2)  || '',
      corporacion2Nombre: this.corporaciones2Map.get(item.corporacion2!) || ''
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
