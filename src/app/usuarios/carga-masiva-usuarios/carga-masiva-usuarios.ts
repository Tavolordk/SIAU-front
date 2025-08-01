import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Workbook } from 'exceljs';
import { forkJoin } from 'rxjs';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { ExcelUsuarioRow } from '../../models/excel.model';
import { CedulaModel, PdfService } from '../../services/pdf.service';
import { CatalogosService } from '../../services/catalogos.service';
import { CargaUsuarioStoreService } from '../../services/carga-usuario-store.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-carga-masiva-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './carga-masiva-usuarios.html',
    styleUrls: ['./carga-masiva-usuarios.scss']
})
export class CargaMasivaUsuariosComponent implements OnInit {
    // — Datos de vista previa
    public get allPreviewData(): ExcelUsuarioRow[] {
        return this.store.getDatosCargados();
    }
    public isCorregido(originalIndex: number): boolean {
        return this.store.estaCorregido(originalIndex) || !!this.allPreviewData[originalIndex].editado;
    }

    private get uncorregidos(): ExcelUsuarioRow[] {
        return this.allPreviewData.filter((_, i) => !this.store.estaCorregido(i));
    }

    // — Control de loaders
    loading = true;
    overlayLoaderVisible = false;
    carmasivMostrandoLoader = false;
    carmasivProgreso = 0;

    // — Archivo seleccionado
    selectedFile?: File;

    // — Toast
    showToast = false;
    isHiding = false;
    toastMessage = '';
    toastColor = '';

    // — Paginación
    currentPage = 1;
    itemsPerPage = 10;

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.uncorregidos.length / this.itemsPerPage));
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    public get previewDataPaginated(): ExcelUsuarioRow[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.allPreviewData.slice(start, start + this.itemsPerPage);
    }



    constructor(
        private router: Router,
        private svc: CargaUsuarioService,
        private catalogoService: CatalogosService,
        private store: CargaUsuarioStoreService,
        private pdfService: PdfService
    ) { }

    ngOnInit(): void {
        // Spinner inicial
        setTimeout(() => this.loading = false, 500);
        // 2) Trae y cachea TODOS los catálogos

        this.catalogoService.getAll().subscribe(res => {
            // Tipos de usuario (radio)
            this.catalogoService.tiposUsuario = res.TipoUsuario
                .map(u => ({ id: u.ID, nombre: u.TP_USUARIO }));

            // Estados / Municipios
            this.catalogoService.entidades = res.Entidades
                .filter(e => e.FK_PADRE === null)
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
            this.catalogoService.municipios = res.Entidades
                .filter(e => e.FK_PADRE !== null)
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));

            // Instituciones / Dependencias / Corporaciones / Áreas
            this.catalogoService.instituciones = res.Estructura
                .filter(e => e.TIPO === 'INSTITUCION')
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
            this.catalogoService.dependencias = res.Estructura
                .filter(e => e.TIPO === 'DEPENDENCIA')
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
            this.catalogoService.corporaciones = res.Estructura
                .filter(e => e.TIPO === 'CORPORACION')
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
            this.catalogoService.areas = res.Estructura
                .filter(e => e.TIPO === 'AREA')
                .map(e => ({ id: e.ID, nombre: e.NOMBRE }));
        });
        this.store.setDatosCargados(this.allPreviewData); // después de poblar previewData local
    }

    // Cambia página
    cambiarPagina(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    // --- File picker ---
    openFilePicker(): void {
        document.getElementById('fileInput')?.click();
    }
    handleFileSelection(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFile = input.files[0];
            this.parseExcel(this.selectedFile);
        }
    }

    /** Parsea TODO el Excel según la lógica de tu Razor */
    private async parseExcel(file: File) {
        this.currentPage = 1;

        const buffer = await file.arrayBuffer();
        const wb = new Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0];

        // --- 1) Construye un map encabezado → índice de columna (fila 6) ---
        const HEADER_ROW = 6;
        const headerMap: Record<string, number> = {};
        ws.getRow(HEADER_ROW).eachCell((cell, colNum) => {
            const txt = (cell.value ?? '').toString().trim().toLowerCase();
            if (txt) headerMap[txt] = colNum;
        });

        const findCol = (...keys: string[]): number | undefined => {
            for (const key of keys) {
                const idx = headerMap[key.trim().toLowerCase()];
                if (idx) return idx;
            }
            return undefined;
        };

        // --- 2) Itera filas de datos (de la 7 en adelante) ---
        for (let rn = HEADER_ROW + 1; rn <= ws.rowCount; rn++) {
            const row = ws.getRow(rn);

            // Salta si no hay oficio *ni* nombre
            const oficioCol = findCol('nc', 'oficio', 'fill1');
            const nombreCol = findCol('nombre (s)', 'nombre');
            const fullName = nombreCol
                ? row.getCell(nombreCol).text?.toString().trim() ?? ''
                : '';

            let nombre1 = '';
            let nombre2 = '';
            if (fullName) {
                const parts = fullName.split(/\s+/);
                nombre1 = parts.shift()!;
                nombre2 = parts.length ? parts.join(' ') : '';
            } const oficioVal = oficioCol ? row.getCell(oficioCol).text?.toString().trim() ?? '' : '';
            const nombreVal = nombreCol ? row.getCell(nombreCol).text?.toString().trim() ?? '' : '';
            if (!oficioVal && !nombreVal) continue;

            // Genera objeto base con errores vacíos
            const rec: ExcelUsuarioRow = {
                fill1: oficioVal || null,
                nombre: nombre1 || null,
                apellidoPaterno: (findCol('apellido paterno') ? row.getCell(findCol('apellido paterno')!).text?.toString() : null) ?? null,
                apellidoMaterno: (findCol('apellido materno') ? row.getCell(findCol('apellido materno')!).text?.toString() : null) ?? null,
                rfc: (findCol('rfc') ? row.getCell(findCol('rfc')!).text?.toString() : null) ?? null,
                correoElectronico: (findCol('correo electrónico', 'correo') ? row.getCell(findCol('correo electrónico', 'correo')!).text?.toString() : null) ?? null,
                telefono: (findCol('teléfono', 'telefono') ? row.getCell(findCol('teléfono', 'telefono')!).text?.toString() : null) ?? null,
                tipoUsuario: Number(findCol('TIPO DE DEPENDENCIA') ? row.getCell(findCol('TIPO DE DEPENDENCIA')!).value : 0) || 0,
                entidad: Number(findCol('ENTIDAD') ? row.getCell(findCol('ENTIDAD')!).value : 0) || 0,
                municipio: (findCol('MUNICIPIO') ? row.getCell(findCol('MUNICIPIO')!).text?.toString() : null) ?? null,
                institucion: Number(findCol('INSTITUCION') ? row.getCell(findCol('INSTITUCION')!).value : 0) || 0,
                dependencia: Number(findCol('TIPO DE DEPENDENCIA') ? row.getCell(findCol('TIPO DE DEPENDENCIA')!).value : 0) || 0,
                corporacion: Number(findCol('CORPORACION') ? row.getCell(findCol('CORPORACION')!).value : 0) || 0,
                area: Number(findCol('AREA') ? row.getCell(findCol('AREA')!).value : 0) || 0,
                cargo: (findCol('CARGO') ? row.getCell(findCol('CARGO')!).text?.toString() : null) ?? null,
                funciones: (findCol('FUNCIONES') ? row.getCell(findCol('FUNCIONES')!).text?.toString() : null) ?? null,
                pais: (findCol('país', 'pais') ? row.getCell(findCol('país', 'pais')!).text?.toString() : null) ?? null,
                entidad2: (findCol('ENTIDAD1') ? row.getCell(findCol('ENTIDAD1')!).text?.toString() : null) ?? null,
                municipio2: (findCol('MUNICIPIO1') ? row.getCell(findCol('MUNICIPIO1')!).text?.toString() : null) ?? null,
                corporacion2: (findCol('CORPORACION1') ? row.getCell(findCol('CORPORACION1')!).text?.toString() : null) ?? null,
                consultaTextos: {},
                modulosOperacion: {},
                checkBox1: false,
                checkBox2: false,
                checkBox3: false,
                checkBox4: false,
                checkBox5: false,
                descargar: false,
                errores: [],
                descripcionerror: null,
                ok: false,
                nombreFirmaEnlace: (findCol('NOMBRE Y FIRMA DEL USUARIO') ? row.getCell(findCol('NOMBRE Y FIRMA DEL USUARIO')!).text?.toString() : null) ?? null,
                nombreFirmaResponsable: (findCol('NOMBRE CARGO Y FIRMA DEL RESPONSABLE DE LA INSTITUCIÓN') ? row.getCell(findCol('NOMBRE CARGO Y FIRMA DEL RESPONSABLE DE LA INSTITUCIÓN')!).text?.toString() : null) ?? null,
                nombreFirmaUsuario: (findCol('NOMBRE Y FIRMA DEL ENLACE ESTATAL/ INSTITUCIONAL') ? row.getCell(findCol('NOMBRE Y FIRMA DEL ENLACE ESTATAL/ INSTITUCIONAL')!).text?.toString() : null) ?? null,
                cuentaUsuario: (findCol('USUARIO          (En caso de aplicar)') ? row.getCell(findCol('USUARIO          (En caso de aplicar)')!).text?.toString() : null) ?? null,
                cuip: (findCol('CUIP               (EN CASO DE APLICAR)') ? row.getCell(findCol('CUIP               (EN CASO DE APLICAR)')!).text?.toString() : null) ?? null,
                curp: '',
                nombre2: nombre2,
                areaNombre: '',
                corporacionNombre: '',
                dependenciaNombre: '',
                institucionNombre: '',
                municipioNombre: '',
                entidadNombre: ''
            };

            // --- 3) Validaciones ---
            // Oficio
            if (!rec.fill1) {
                rec.errores.push('Oficio es obligatorio');
            } else if (rec.fill1.length > 20) {
                rec.errores.push('Oficio: máximo 20 caracteres');
            }

            // Nombre
            if (!rec.nombre) {
                rec.errores.push('Nombre(s) es obligatorio');
            } else if (rec.nombre.length > 100) {
                rec.errores.push('Nombre(s): máximo 100 caracteres');
            }

            // Apellido Paterno
            if (!rec.apellidoPaterno) {
                rec.errores.push('Apellido Paterno es obligatorio');
            } else if (rec.apellidoPaterno.length > 100) {
                rec.errores.push('Apellido Paterno: máximo 100 caracteres');
            }

            // Apellido Materno (opcional)
            if (rec.apellidoMaterno && rec.apellidoMaterno.length > 100) {
                rec.errores.push('Apellido Materno: máximo 100 caracteres');
            }

            // RFC
            if (!rec.rfc) {
                rec.errores.push('RFC es obligatorio');
            } else if (rec.rfc.length > 13) {
                rec.errores.push('RFC: máximo 13 caracteres');
            } else if (!/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i.test(rec.rfc)) {
                rec.errores.push('Formato inválido (SAT)');
            }

            // Correo
            if (!rec.correoElectronico) {
                rec.errores.push('Correo requerido');
            } else {
                // valida formato básico
                const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                if (!emailPattern.test(rec.correoElectronico)) {
                    rec.errores.push('No es un correo válido');
                }
            }

            // Teléfono (opcional)
            if (rec.telefono && !/^\d{7,10}$/.test(rec.telefono)) {
                rec.errores.push('Teléfono debe tener 7–10 dígitos');
            }

            // Campos numéricos obligatorios >0 (entidad, institucion, dependencia, area)
            ['entidad', 'institucion', 'dependencia', 'area'].forEach(k => {
                const v = rec[k as keyof ExcelUsuarioRow] as number;
                if (v <= 0) {
                    // homologa el mensaje con algo entendible
                    rec.errores.push(`${k} debe ser mayor que 0`);
                }
            });

            // Cargo
            if (!rec.cargo) {
                rec.errores.push('Cargo es obligatorio');
            } else if (rec.cargo.length > 100) {
                rec.errores.push('Cargo: máximo 100 caracteres');
            }

            // Funciones
            if (!rec.funciones) {
                rec.errores.push('Funciones es obligatorio');
            } else if (rec.funciones.length > 300) {
                rec.errores.push('Funciones: máximo 300 caracteres');
            }

            // País (opcional)
            if (rec.pais && rec.pais.length > 100) {
                rec.errores.push('País: máximo 100 caracteres');
            }
            const checkboxMappings: { prop: keyof ExcelUsuarioRow, keys: string[] }[] = [
                { prop: 'checkBox1', keys: ['nueva cta'] },
                { prop: 'checkBox2', keys: ['mod perfil'] },
                { prop: 'checkBox3', keys: ['ampl perfil'] },
                { prop: 'checkBox4', keys: ['react cta'] },
                { prop: 'checkBox5', keys: ['camb adsc'] },
            ];

            for (const { prop, keys } of checkboxMappings) {
                const colIndex = findCol(...keys);
                if (colIndex) {
                    const cell = row.getCell(colIndex).text?.toString().trim().toLowerCase();
                    // Si contiene una “x” (mayúscula o minúscula) lo marcamos true
                    (rec[prop] as boolean) = (cell === 'x');
                }
            }
            // ——— 4) EXTRAER “Perfil Solicitado” ———

            // Lista de cabeceras tal como aparecen en fila 6
            const perfilKeys = ['perfil 1', 'perfil 2', 'perfil 3', 'perfil 4', 'perfil 5'];

            // Resuelve cada nombre a su columna (si existe)
            const perfilCols: number[] = perfilKeys
                .map(k => findCol(k))    // findCol = tu helper que busca en headerMap
                .filter((c): c is number => !!c);

            // Lee los valores no vacíos
            const codes: string[] = [];
            for (const col of perfilCols) {
                const txt = (row.getCell(col).value ?? '').toString().trim();
                if (txt) {
                    codes.push(txt);
                }
            }

            // ——— 5) ASIGNAR A consultaTextos Y modulosOperacion ———
            for (let i = 0; i < codes.length && i < 56; i++) {
                const key = `Text${8 + i}`;        // Text8, Text9, … Text63
                if (i < 28) {
                    rec.consultaTextos[key] = codes[i];
                } else {
                    rec.modulosOperacion[key] = codes[i];
                }
            }
            rec.ok = rec.errores.length === 0;
            rec.descripcionerror = rec.ok
                ? ''
                : `CAMPOS INCORRECTOS: ${rec.errores.join(', ')} ENTRE OTROS`;
            rec.entidadNombre = this.catalogoService.getEntidadNameById(rec.entidad) || '';
            rec.municipioNombre = rec.municipio || '';
            rec.institucionNombre = this.catalogoService.getInstitucionNameById(rec.institucion) || '';
            rec.dependenciaNombre = this.catalogoService.getDependenciaNameById(rec.dependencia) || '';
            rec.corporacionNombre = this.catalogoService.getCorporacionNameById(rec.corporacion) || '';
            rec.areaNombre = this.catalogoService.getAreaNameById(rec.area) || '';
            this.allPreviewData.push(rec);
            this.store.setDatosCargados(this.allPreviewData);
        }
    }

    // --- Envía toda la carga masiva al API ---
async sendSolicitudMasiva() {
  if (!this.allPreviewData.length) {
    this.showToastMessage('No hay datos para enviar', 'warn');
    return;
  }

  const ready = this.allPreviewData.filter(row => row.ok || row.editado);
  const selectedReady = ready.filter(r => r.descargar);
  let toSend: ExcelUsuarioRow[] = [];

  if (selectedReady.length) {
    toSend = selectedReady;
  } else if (ready.length) {
    toSend = ready;
  } else {
    this.showToastMessage('No hay ningún archivo correcto para cargar', 'warn');
    return;
  }

  this.overlayLoaderVisible = true;
  this.carmasivMostrandoLoader = true;
  this.carmasivProgreso = 0;

  const calls = toSend.map((item, i) =>
    this.svc.saveUsuarioSolicitud(item).pipe(res => {
      this.carmasivProgreso = Math.round(((i + 1) / toSend.length) * 100);
      return res;
    })
  );

  forkJoin(calls).subscribe({
    next: () => {
      this.showToastMessage('Carga masiva completada', 'success');
    },
    error: err => {
      console.error('Error en carga masiva:', err);
      this.showToastMessage('Error al guardar algunos registros', 'error');
    },
    complete: () => {
      this.overlayLoaderVisible = false;
      this.carmasivMostrandoLoader = false;
      this.carmasivProgreso = 0;
    }
  });
}

async descargarPDFsMasivos() {
  if (!this.allPreviewData.length) {
    this.showToastMessage('No hay datos para descargar', 'warn');
    return;
  }

  const ready = this.allPreviewData.filter(row => row.ok || row.editado);
  const selectedReady = ready.filter(r => r.descargar);
  let toDownload: ExcelUsuarioRow[] = [];

  if (selectedReady.length) {
    toDownload = selectedReady;
  } else if (ready.length) {
    toDownload = ready;
  } else {
    this.showToastMessage('No hay ningún archivo correcto para descargar', 'warn');
    return;
  }

  this.showToastMessage('Generando PDFs y creando ZIP...', 'info');
  const zip = new JSZip();

  for (const cedula of toDownload) {
    // Construye el modelo para PDF igual que en downloadPDF individual
    const datos: CedulaModel = {
      fill1: cedula.fill1,
      folio: cedula.fill1,
      cuentaUsuario: cedula.cuentaUsuario,
      correoElectronico: cedula.correoElectronico,
      telefono: cedula.telefono,
      apellidoPaterno: cedula.apellidoPaterno,
      apellidoMaterno: cedula.apellidoMaterno,
      nombre: cedula.nombre,
      nombre2: cedula.nombre2,
      rfc: cedula.rfc,
      cuip: cedula.cuip,
      curp: cedula.curp,
      tipoUsuario: cedula.tipoUsuario,
      entidad: cedula.entidad,
      municipio: this.catalogoService.getMunicipioIdByName(cedula.municipio!),
      institucion: cedula.institucion,
      corporacion: cedula.corporacion,
      area: cedula.area,
      cargo: cedula.cargo,
      funciones: cedula.funciones,
      funciones2: '',
      pais: cedula.pais,
      entidad2: this.catalogoService.getEntidadIdByName(cedula.entidad2!),
      municipio2: this.catalogoService.getMunicipioIdByName(cedula.municipio2!),
      corporacion2: this.catalogoService.getCorporacionIdByName(cedula.corporacion2!),
      consultaTextos: cedula.consultaTextos,
      modulosOperacion: cedula.modulosOperacion,
      checkBox1: cedula.checkBox1,
      checkBox2: cedula.checkBox2,
      checkBox3: cedula.checkBox3,
      checkBox4: cedula.checkBox4,
      checkBox5: cedula.checkBox5,

      entidadNombre: (() => {
        const id = Number(cedula.entidad);
        if (!isNaN(id) && id > 0) return this.catalogoService.getEntidadNameById(id) || '';
        return typeof cedula.entidad === 'string' ? cedula.entidad : '';
      })(),
      municipioNombre: (() => {
        const id = Number(cedula.municipio);
        if (!isNaN(id) && id > 0) return this.catalogoService.getMunicipioNameById(id) || '';
        return typeof cedula.municipio === 'string' ? cedula.municipio : '';
      })(),
      institucionNombre: (() => {
        const id = Number(cedula.institucion);
        if (!isNaN(id) && id > 0) return this.catalogoService.getInstitucionNameById(id) || '';
        return typeof cedula.institucion === 'string' ? cedula.institucion : '';
      })(),
      dependenciaNombre: (() => {
        const id = Number(cedula.dependencia);
        if (!isNaN(id) && id > 0) return this.catalogoService.getDependenciaNameById(id) || '';
        return typeof cedula.dependencia === 'string' ? cedula.dependencia : '';
      })(),
      corporacionNombre: (() => {
        const id = Number(cedula.corporacion);
        if (!isNaN(id) && id > 0) return this.catalogoService.getCorporacionNameById(id) || '';
        return typeof cedula.corporacion === 'string' ? cedula.corporacion : '';
      })(),
      areaNombre: (() => {
        const id = Number(cedula.area);
        if (!isNaN(id) && id > 0) return this.catalogoService.getAreaNameById(id) || '';
        return typeof cedula.area === 'string' ? cedula.area : '';
      })(),
      entidad2Nombre: (() => {
        const id = Number(cedula.entidad2);
        if (!isNaN(id) && id > 0) return this.catalogoService.getEntidadNameById(id) || '';
        return typeof cedula.entidad2 === 'string' ? cedula.entidad2 : '';
      })(),
      municipio2Nombre: (() => {
        const id = Number(cedula.municipio2);
        if (!isNaN(id) && id > 0) return this.catalogoService.getMunicipioNameById(id) || '';
        return typeof cedula.municipio2 === 'string' ? cedula.municipio2 : '';
      })(),
      corporacion2Nombre: (() => {
        const id = Number(cedula.corporacion2);
        if (!isNaN(id) && id > 0) return this.catalogoService.getCorporacionNameById(id) || '';
        return typeof cedula.corporacion2 === 'string' ? cedula.corporacion2 : '';
      })(),

      nombreFirmaEnlace: cedula.nombreFirmaEnlace,
      nombreFirmaResponsable: cedula.nombreFirmaResponsable,
      nombreFirmaUsuario: cedula.nombreFirmaUsuario
    };

    try {
      const pdfBytes = await this.pdfService.generar(datos);
      const safe = (s: string | undefined | null) => (s || 'SIN_NOMBRE').replace(/\s+/g, '_');
      const filename = `CED_${safe(cedula.nombre)}_${safe(cedula.apellidoPaterno)}_${safe(cedula.apellidoMaterno)}.pdf`;
      zip.file(filename, pdfBytes);
    } catch (e) {
      console.error('Error generando PDF para', cedula, e);
    }
  }

  // Genera ZIP
  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `PDFs_Masivos_${ts}.zip`);
    this.showToastMessage('ZIP con PDFs generado.', 'success');
  } catch (e) {
    console.error('Error creando ZIP', e);
    this.showToastMessage('No se pudo crear el ZIP', 'error');
  }
}


    private showToastMessage(msg: string, color: string) {
        this.toastMessage = msg;
        this.toastColor = color;
        this.showToast = true;
        this.isHiding = false;
        setTimeout(() => {
            this.isHiding = true;
            setTimeout(() => this.showToast = false, 600);
        }, 3000);
    }

    /** Navegar al detalle/edición */
    irIndividual(cedula: ExcelUsuarioRow, indice: number): void {
        this.router.navigate(['cargausuario', indice], {
            state: { cedula }
        });
    }


    /** Botón de descarga individual */
    async downloadPDF(cedula: ExcelUsuarioRow): Promise<void> {
        if (!cedula.ok && !cedula.editado) {
            this.showToastMessage('La solicitud tiene errores y no puede generar PDF', 'warn');
            return;
        }

        // Mapea sólo los campos que tu PdfService necesita.
        // Completa con '' o 0 donde falte.
        const datos: CedulaModel = {
            fill1: cedula.fill1,
            folio: cedula.fill1,
            cuentaUsuario: cedula.cuentaUsuario,
            correoElectronico: cedula.correoElectronico,
            telefono: cedula.telefono,
            apellidoPaterno: cedula.apellidoPaterno,
            apellidoMaterno: cedula.apellidoMaterno,
            nombre: cedula.nombre,
            nombre2: cedula.nombre2,
            rfc: cedula.rfc,
            cuip: cedula.cuip,
            curp: cedula.curp,
            tipoUsuario: cedula.tipoUsuario,
            entidad: cedula.entidad,
            municipio: this.catalogoService.getMunicipioIdByName(cedula.municipio!),
            institucion: cedula.institucion,
            corporacion: cedula.corporacion,
            area: cedula.area,
            cargo: cedula.cargo,
            funciones: cedula.funciones,
            funciones2: '',
            pais: cedula.pais,
            entidad2: this.catalogoService.getEntidadIdByName(cedula.entidad2!),
            municipio2: this.catalogoService.getMunicipioIdByName(cedula.municipio2!),
            corporacion2: this.catalogoService.getCorporacionIdByName(cedula.corporacion2!),
            consultaTextos: cedula.consultaTextos,
            modulosOperacion: cedula.modulosOperacion,
            checkBox1: cedula.checkBox1,
            checkBox2: cedula.checkBox2,
            checkBox3: cedula.checkBox3,
            checkBox4: cedula.checkBox4,
            checkBox5: cedula.checkBox5,

            // estos campos de nombre para el PDF
            entidadNombre: (() => {
                const id = Number(cedula.entidad);
                if (!isNaN(id) && id > 0) return this.catalogoService.getEntidadNameById(id) || '';
                return typeof cedula.entidad === 'string' ? cedula.entidad : '';
            })(),
            municipioNombre: (() => {
                const id = Number(cedula.municipio);
                if (!isNaN(id) && id > 0) return this.catalogoService.getMunicipioNameById(id) || '';
                return typeof cedula.municipio === 'string' ? cedula.municipio : '';
            })(),
            institucionNombre: (() => {
                const id = Number(cedula.institucion);
                if (!isNaN(id) && id > 0) return this.catalogoService.getInstitucionNameById(id) || '';
                return typeof cedula.institucion === 'string' ? cedula.institucion : '';
            })(),
            dependenciaNombre: (() => {
                const id = Number(cedula.dependencia);
                if (!isNaN(id) && id > 0) return this.catalogoService.getDependenciaNameById(id) || '';
                return typeof cedula.dependencia === 'string' ? cedula.dependencia : '';
            })(),
            corporacionNombre: (() => {
                const id = Number(cedula.corporacion);
                if (!isNaN(id) && id > 0) return this.catalogoService.getCorporacionNameById(id) || '';
                return typeof cedula.corporacion === 'string' ? cedula.corporacion : '';
            })(),
            areaNombre: (() => {
                const id = Number(cedula.area);
                if (!isNaN(id) && id > 0) return this.catalogoService.getAreaNameById(id) || '';
                return typeof cedula.area === 'string' ? cedula.area : '';
            })(),
            entidad2Nombre: (() => {
                const id = Number(cedula.entidad2);
                if (!isNaN(id) && id > 0) return this.catalogoService.getEntidadNameById(id) || '';
                return typeof cedula.entidad2 === 'string' ? cedula.entidad2 : '';
            })(),
            municipio2Nombre: (() => {
                const id = Number(cedula.municipio2);
                if (!isNaN(id) && id > 0) return this.catalogoService.getMunicipioNameById(id) || '';
                return typeof cedula.municipio2 === 'string' ? cedula.municipio2 : '';
            })(),
            corporacion2Nombre: (() => {
                const id = Number(cedula.corporacion2);
                if (!isNaN(id) && id > 0) return this.catalogoService.getCorporacionNameById(id) || '';
                return typeof cedula.corporacion2 === 'string' ? cedula.corporacion2 : '';
            })(),

            nombreFirmaEnlace: cedula.nombreFirmaEnlace,
            nombreFirmaResponsable: cedula.nombreFirmaResponsable,
            nombreFirmaUsuario: cedula.nombreFirmaUsuario
        };

        try {
            await this.pdfService.generarYDescargar(datos);
        } catch (e) {
            console.error('Error generando PDF', e);
            this.showToastMessage('No se pudo generar el PDF', 'error');
        }
    }
/** índice original absoluto calculado desde la página */
getOriginalIndex(pageIndex: number): number {
  return (this.currentPage - 1) * this.itemsPerPage + pageIndex;
}

isListoParaDescargar(cedula: ExcelUsuarioRow, originalIndex: number): boolean {
  return !!(cedula.ok || this.isCorregido(originalIndex));
}
}
