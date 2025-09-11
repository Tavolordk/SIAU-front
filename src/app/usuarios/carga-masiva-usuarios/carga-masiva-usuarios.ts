import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Workbook } from 'exceljs';
import { forkJoin, from, of } from 'rxjs';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { ExcelUsuarioRow } from '../../models/excel.model';
import { CedulaModel, PdfService } from '../../services/pdf.service';
import { CatalogosService } from '../../services/catalogos.service';
import { CargaUsuarioStoreService } from '../../services/carga-usuario-store.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { mapExcelRowToCedula, mapExcelRowToSolicitudBody, pdfFileName } from '../../models/cedula.mapper.model';
import { catchError, concatMap, finalize, tap } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import {
    isRfcValid,
    isCurpValid,
    emailBasicValidator,
    phoneMxValidator,
} from '../../shared/validators';

type RowVM = ExcelUsuarioRow & {
    __sending?: boolean;
    __okSent?: boolean;
    __errorMsg?: string;
    __fadeOut?: boolean;
};
@Component({
    selector: 'app-carga-masiva-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './carga-masiva-usuarios.html',
    styleUrls: ['./carga-masiva-usuarios.scss']
})

export class CargaMasivaUsuariosComponent implements OnInit {
    // Toggle en la vista
    mostrarSoloIncorrectos = false;

    // Asegura que todas las filas tengan las banderas UI
    private hydrateRows(rows: ExcelUsuarioRow[]): RowVM[] {
        return rows.map(r => ({
            ...r,
            __sending: false,
            __okSent: false,
            __errorMsg: '',
            __fadeOut: false
        }));
    }

    // Si necesitas hidratar sólo si aún no traen banderas
    private ensureHydrated(rows: ExcelUsuarioRow[]): RowVM[] {
        return rows.map(r => ('__sending' in r ? (r as RowVM) : {
            ...r,
            __sending: false,
            __okSent: false,
            __errorMsg: '',
            __fadeOut: false
        }));
    }

    // Se usa en el *ngFor del HTML
    get rowsVisibles(): RowVM[] {
        const data = (this.allPreviewData as RowVM[]) ?? [];
        return this.mostrarSoloIncorrectos
            ? data.filter(r => !r.__okSent && !(r.ok || r.editado))
            : data.filter(r => !r.__okSent);
    }

    // Habilita el botón CARGAR
    get haySeleccionValida(): boolean {
        return (this.allPreviewData as RowVM[]).some(
            r => r.descargar && (r.ok || r.editado) && !r.__okSent
        );
    }

    // — Datos de vista previa
    public get allPreviewData(): ExcelUsuarioRow[] {
        return this.store.getDatosCargados();
    }
    // O ELIMÍNALO. Si lo dejas, que NO se llame a sí mismo:
    set allPreviewData(v: ExcelUsuarioRow[]) {
        this.store.setDatosCargados(v);
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
        private pdfService: PdfService,
        private usuarioSvc: UsuarioService
    ) { }

    ngOnInit(): void {
        // Spinner inicial
        setTimeout(() => this.loading = false, 500);
        // 2) Trae y cachea TODOS los catálogos

        this.catalogoService.getAll().subscribe(res => {
            // Tipos de usuario (radio)
            this.catalogoService.tiposUsuario = res.TipoUsuario
                .map(u => ({ id: u.id, nombre: u.tP_USUARIO }));

            // Estados / Municipios
            this.catalogoService.entidades = res.Entidades
                .filter(e => e.fK_PADRE === null)
                .map(e => ({ id: e.id, nombre: e.nombre }));
            this.catalogoService.municipios = res.Entidades
                .filter(e => e.fK_PADRE !== null)
                .map(e => ({ id: e.id, nombre: e.nombre }));

            // Instituciones / Dependencias / Corporaciones / Áreas
            this.catalogoService.instituciones = res.Estructura
                .filter(e => e.tipo === 'INSTITUCION')
                .map(e => ({ id: e.id, nombre: e.nombre }));
            this.catalogoService.dependencias = res.Estructura
                .filter(e => e.tipo === 'DEPENDENCIA')
                .map(e => ({ id: e.id, nombre: e.nombre }));
            this.catalogoService.corporaciones = res.Estructura
                .filter(e => e.tipo === 'CORPORACION')
                .map(e => ({ id: e.id, nombre: e.nombre }));
            this.catalogoService.areas = res.Estructura
                .filter(e => e.tipo === 'AREA')
                .map(e => ({ id: e.id, nombre: e.nombre }));
            this.catalogoService.perfiles = res.Perfiles
                .map(p => ({ id: p.id, clave: p.clave, nombre: p.funcion }));
                this.catalogoService.paises = (res.Paises || []).map((p: any) => ({ id: p.id, nombre: p.nombre }));
        });
        const hydrated = this.ensureHydrated(this.allPreviewData);
        this.store.setDatosCargados(hydrated);
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
                corporacion2: (findCol('CORPORACION1') ? row.getCell(findCol('CORPORACION1')!).text?.toString() : '') ?? null,
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
            } else if (!isRfcValid(rec.rfc, true)) {
                rec.errores.push('Formato inválido (SAT) o DV incorrecto');
            }

            // Correo
            const emailOk = emailBasicValidator()({ value: rec.correoElectronico } as any) === null;
            if (!rec.correoElectronico) {
                rec.errores.push('Correo requerido');
            } else if (!emailOk) {
                rec.errores.push('No es un correo válido');
            }

            // Teléfono (opcional)
            const telOk = phoneMxValidator()({ value: rec.telefono } as any) === null;
            if (rec.telefono && !telOk) {
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
            // --- 4) EXTRAER “Perfil Solicitado” (soporta varios en una celda) ---
            const perfilKeys = ['perfil 1', 'perfil 2', 'perfil 3', 'perfil 4', 'perfil 5', 'perfiles', 'perfil']; // agrega alias si tu hoja usa otro nombre
            const perfilCols: number[] = perfilKeys
                .map(k => findCol(k))
                .filter((c): c is number => !!c);

            const codes: string[] = [];

            // helper: recibe el texto de una celda y agrega todas las claves encontradas
            const pushCodesFromCell = (raw: string) => {
                // separa por coma, punto y coma, salto de línea, barra vertical o slash
                raw.split(/[,\n;|/]+/).forEach(piece => {
                    const p = piece.trim();
                    if (!p) return;

                    // si viene "0401 - Algo", "0401 Algo", "0401"… extrae la clave (3–5 dígitos)
                    const m = p.match(/(\d{3,5})/);
                    if (m) codes.push(m[1]);
                });
            };

            for (const col of perfilCols) {
                const raw = (row.getCell(col).value ?? '').toString();
                if (raw) pushCodesFromCell(raw);
            }

            // quita duplicados y normaliza
            const uniqueCodes = Array.from(new Set(codes));

            const valid = new Set((this.catalogoService.perfiles || []).map(p => String(p.clave).trim()));
            const validCodes = codes.map(c => String(c || '').trim()).filter(c => c && valid.has(c));
            // ——— 5) ASIGNAR A consultaTextos Y modulosOperacion ———
            for (let i = 0; i < validCodes.length && i < 56; i++) {
                const key = `Text${8 + i}`;
                if (i < 28) rec.consultaTextos[key] = validCodes[i];
                else rec.modulosOperacion[key] = validCodes[i];
            }
            rec.consultaTextos = { ...(rec.consultaTextos || {}) };
            rec.modulosOperacion = { ...(rec.modulosOperacion || {}) };
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
            const recVM: RowVM = {
                ...rec,
                __sending: false,
                __okSent: false,
                __errorMsg: '',
                __fadeOut: false,
                consultaTextos: { ...(rec.consultaTextos || {}) },
                modulosOperacion: { ...(rec.modulosOperacion || {}) },
            };

            // actualización inmutable para evitar efectos raros del getter
            this.store.setDatosCargados([...(this.allPreviewData as RowVM[]), recVM]);

        }
    }

    // --- Envía toda la carga masiva al API ---
    sending = false;

    async sendSolicitudMasiva() {
        if (this.sending) return;
        if (!this.allPreviewData.length) { this.showToastMessage('No hay datos para enviar', 'warn'); return; }

        const rows = (this.allPreviewData as RowVM[]);
        const seleccionadosValidos = rows.filter(r => r.descargar && (r.ok || r.editado));
        const registrosAEnviar = (seleccionadosValidos.length ? seleccionadosValidos : rows.filter(r => (r.ok || r.editado)));

        if (!registrosAEnviar.length) {
            this.showToastMessage('No hay ningún archivo correcto para cargar', 'warn');
            return;
        }

        this.sending = true;
        this.overlayLoaderVisible = true;
        this.carmasivMostrandoLoader = true;
        this.carmasivProgreso = 0;

        const total = registrosAEnviar.length;
        let exito = 0, fallo = 0;

        from(registrosAEnviar).pipe(
            concatMap((row, idx) => {
                row.__sending = true;
                return this.svc.saveUsuarioSolicitud(row).pipe(
                    tap(() => {
                        row.__sending = false;
                        row.__okSent = true;
                        row.__errorMsg = '';
                        exito++;
                        this.carmasivProgreso = Math.round(((idx + 1) / total) * 100);
                    }),
                    catchError(err => {
                        row.__sending = false;
                        row.__okSent = false;
                        row.__errorMsg = (err?.error?.detail || err?.message || 'Error desconocido');
                        fallo++;
                        this.carmasivProgreso = Math.round(((idx + 1) / total) * 100);
                        return of(null);
                    })
                );
            }),
            finalize(() => {
                // 1) animación: marca fadeOut a los OK
                const toRemoveIdxs: number[] = [];
                for (let i = rows.length - 1; i >= 0; i--) {
                    if (rows[i].__okSent) {
                        rows[i].__fadeOut = true;
                        toRemoveIdxs.push(i);
                    }
                }

                // 2) espera la transición y elimina del array + store
                setTimeout(() => {
                    for (let j = 0; j < toRemoveIdxs.length; j++) {
                        const idx = toRemoveIdxs[j];
                        // ojo: si prefieres evitar problemas con índices, quita de atrás hacia adelante:
                        // (pero como esperamos 200ms, el orden ya no importa mucho)
                    }
                    for (let i = rows.length - 1; i >= 0; i--) {
                        if (rows[i].__okSent) rows.splice(i, 1);
                    }

                    this.store?.setDatosCargados?.(rows);

                    // 3) fin UI
                    this.overlayLoaderVisible = false;
                    this.carmasivMostrandoLoader = false;
                    this.carmasivProgreso = 0;
                    this.sending = false;

                    // 4) resumen
                    const totalEnv = total;
                    if (fallo === 0) {
                        this.showToastMessage(`Carga masiva completada (${exito}/${totalEnv})`, 'success');
                    } else if (exito === 0) {
                        this.showToastMessage(`Todos fallaron (${fallo}/${totalEnv}). Revisa los errores.`, 'error');
                    } else {
                        this.showToastMessage(`Carga parcial: ${exito} ok, ${fallo} con error (de ${totalEnv}).`, 'warn');
                    }
                }, 200); // duración de la transición CSS
            })
        ).subscribe();
    }
    get enviadosCount(): number {
        return (this.allPreviewData ?? []).filter((r: any) => r.__okSent).length;
    }

    get pendientesCount(): number {
        return (this.allPreviewData ?? []).filter((r: any) => !r.__okSent).length;
    }

    async descargarPDFsMasivos() {
        if (!this.allPreviewData.length) {
            this.showToastMessage('No hay datos para descargar', 'warn');
            return;
        }

        const ready = this.allPreviewData.filter(row => row.ok || row.editado);
        const selectedReady = ready.filter(r => r.descargar);
        const toDownload = selectedReady.length ? selectedReady : ready;

        if (!toDownload.length) {
            this.showToastMessage('No hay ningún archivo correcto para descargar', 'warn');
            return;
        }

        this.showToastMessage('Generando PDFs y creando ZIP...', 'info');

        const zip = new JSZip();
        const OMITIR_SI_SIN_PERFILES = false; // cambia a true si quieres saltar PDFs sin perfiles válidos

        for (const cedula of toDownload) {
            const model = mapExcelRowToCedula(cedula, this.catalogoService);

            // <<< AQUI filtramos contra catálogo >>>
            this.filtrarPerfilesInvalidos(model);

            if (OMITIR_SI_SIN_PERFILES) {
                const totalPerfiles =
                    Object.keys(model.consultaTextos || {}).length +
                    Object.keys(model.modulosOperacion || {}).length;
                if (totalPerfiles === 0) {
                    console.warn('Sin perfiles válidos; omitiendo PDF de', model.rfc);
                    continue;
                }
            }

            try {
                const pdfBytes = await this.pdfService.generar(model);
                zip.file(pdfFileName(model), pdfBytes);
            } catch (e) {
                console.error('Error generando PDF', model.rfc, e);
            }
        }

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

        const model = mapExcelRowToCedula(cedula, this.catalogoService);

        try {
            await this.pdfService.generarYDescargar(model);
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
        const r = cedula as RowVM;
        return !!((cedula.ok || this.isCorregido(originalIndex)) && !r.__sending && !r.__okSent);
    }

    /** hay al menos un registro válido (ok o editado) */
    get hayRegistrosListos(): boolean {
        return this.allPreviewData.some(r => !!(r.ok || r.editado));
    }

    /** hay seleccionados para enviar (marcados con descargar y válidos) */
    get haySeleccionadosListos(): boolean {
        return this.allPreviewData.some(r => r.descargar && (r.ok || r.editado));
    }
    selectValidos(): void {
        for (const r of (this.allPreviewData as RowVM[])) {
            if ((r.ok || r.editado) && !r.__okSent && !r.__sending) {
                r.descargar = true;
            }
        }
    }

    limpiarSeleccion(): void {
        for (const r of (this.allPreviewData as RowVM[])) {
            if (!r.__okSent && !r.__sending) {
                r.descargar = false;
            }
        }
    }

    // Reempaca valores en Text8.. o Text36.. sin huecos
    private repack(values: string[], start: number): Record<string, string> {
        const out: Record<string, string> = {};
        values.forEach((code, i) => out[`Text${start + i}`] = code);
        return out;
    }

    // Elimina claves que no existan en el catálogo y reempaca
    private filtrarPerfilesInvalidos(model: CedulaModel): void {
        const valid = new Set(
            (this.catalogoService.perfiles || []).map(p => String(p.clave).trim())
        );

        const consVals = Object.values(model.consultaTextos || [])
            .map(v => String(v || '').trim())
            .filter(v => v && valid.has(v));

        const modVals = Object.values(model.modulosOperacion || [])
            .map(v => String(v || '').trim())
            .filter(v => v && valid.has(v));

        model.consultaTextos = this.repack(consVals, 8);    // Text8..Text35
        model.modulosOperacion = this.repack(modVals, 36);  // Text36..Text63
    }

}
