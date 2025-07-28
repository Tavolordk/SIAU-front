import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Workbook } from 'exceljs';
import { forkJoin } from 'rxjs';
import { CargaUsuarioService } from '../../services/carga-usuario.service';
import { ExcelUsuarioRow } from '../../models/excel.model';

@Component({
    selector: 'app-carga-masiva-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './carga-masiva-usuarios.html',
    styleUrls: ['./carga-masiva-usuarios.scss']
})
export class CargaMasivaUsuariosComponent implements OnInit {
    // — Datos de vista previa
    previewData: ExcelUsuarioRow[] = [];

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
        return Math.max(1, Math.ceil(this.previewData.length / this.itemsPerPage));
    }
    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    get previewDataPaginated(): ExcelUsuarioRow[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.previewData.slice(start, start + this.itemsPerPage);
    }

    constructor(
        private router: Router,
        private svc: CargaUsuarioService
    ) { }

    ngOnInit(): void {
        // Spinner inicial
        setTimeout(() => this.loading = false, 500);
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
        this.previewData = [];
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
            const oficioVal = oficioCol ? row.getCell(oficioCol).text?.toString().trim() ?? '' : '';
            const nombreVal = nombreCol ? row.getCell(nombreCol).text?.toString().trim() ?? '' : '';
            if (!oficioVal && !nombreVal) continue;

            // Genera objeto base con errores vacíos
            const rec: ExcelUsuarioRow = {
                fill1: oficioVal || null,
                nombre: nombreVal || null,
                apellidoPaterno: (findCol('apellido paterno') ? row.getCell(findCol('apellido paterno')!).text?.toString() : null) ?? null,
                apellidoMaterno: (findCol('apellido materno') ? row.getCell(findCol('apellido materno')!).text?.toString() : null) ?? null,
                rfc: (findCol('rfc') ? row.getCell(findCol('rfc')!).text?.toString() : null) ?? null,
                correoElectronico: (findCol('correo electrónico', 'correo') ? row.getCell(findCol('correo electrónico', 'correo')!).text?.toString() : null) ?? null,
                telefono: (findCol('teléfono', 'telefono') ? row.getCell(findCol('teléfono', 'telefono')!).text?.toString() : null) ?? null,
                tipoUsuario:(findCol('USUARIO          (En caso de aplicar)') ? row.getCell(findCol('USUARIO          (En caso de aplicar)')!).text?.toString() : null) ?? null,
                entidad: Number(findCol('entidad') ? row.getCell(findCol('entidad')!).value : 0) || 0,
                municipio: (findCol('MUNICIPIO') ? row.getCell(findCol('MUNICIPIO')!).text?.toString() : null) ?? null,
                institucion: Number(findCol('INSTITUCION') ? row.getCell(findCol('INSTITUCION')!).value : 0) || 0,
                dependencia: Number(findCol('dependencia', 'tipo de dependencia') ? row.getCell(findCol('dependencia', 'tipo de dependencia')!).value : 0) || 0,
                corporacion: Number(findCol('corporación', 'corporacion') ? row.getCell(findCol('corporación', 'corporacion')!).value : 0) || 0,
                area: Number(findCol('AREA') ? row.getCell(findCol('AREA')!).value : 0) || 0,
                cargo: (findCol('cargo', 'nombre cargo') ? row.getCell(findCol('cargo', 'nombre cargo')!).text?.toString() : null) ?? null,
                funciones: (findCol('funciones') ? row.getCell(findCol('funciones')!).text?.toString() : null) ?? null,
                pais: (findCol('país', 'pais') ? row.getCell(findCol('país', 'pais')!).text?.toString() : null) ?? null,
                entidad2: (findCol('entidad1') ? row.getCell(findCol('entidad1')!).text?.toString() : null) ?? null,
                municipio2: (findCol('municipio1') ? row.getCell(findCol('municipio1')!).text?.toString() : null) ?? null,
                corporacion2: (findCol('corporacion1') ? row.getCell(findCol('corporacion1')!).text?.toString() : null) ?? null,
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
            };

            // --- 3) Validaciones ---
            // Oficio
            if (!rec.fill1) rec.errores.push('Oficio es obligatorio');
            else if (rec.fill1.length > 20) rec.errores.push('Oficio: máximo 20 caracteres');
            // Nombre
            if (!rec.nombre) rec.errores.push('Nombre(s) es obligatorio');
            else if (rec.nombre.length > 100) rec.errores.push('Nombre(s): máximo 100 caracteres');

            // Apellido Paterno
            if (!rec.apellidoPaterno) rec.errores.push('Apellido Paterno es obligatorio');
            else if (rec.apellidoPaterno.length > 100) rec.errores.push('Apellido Paterno: máximo 100 caracteres');

            // Apellido Materno (opcional)
            if (rec.apellidoMaterno && rec.apellidoMaterno.length > 100)
                rec.errores.push('Apellido Materno: máximo 100 caracteres');

            // RFC
            if (!rec.rfc) rec.errores.push('RFC es obligatorio');
            else if (!/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i.test(rec.rfc))
                rec.errores.push('RFC formato inválido');

            // Correo
            if (!rec.correoElectronico) rec.errores.push('Correo electrónico es obligatorio');
            else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.correoElectronico))
                rec.errores.push('Correo formato inválido');

            // Teléfono (opcional)
            if (rec.telefono && !/^\d{7,10}$/.test(rec.telefono))
                rec.errores.push('Teléfono debe tener 7–10 dígitos');

            // Campos numéricos obligatorios >0
            ['entidad', 'institucion', 'dependencia', 'area']
                .forEach(k => {
                    const v = rec[k as keyof ExcelUsuarioRow] as number;
                    if (v <= 0) rec.errores.push(`${k} debe ser mayor que 0`);
                });

            // Cargo
            if (!rec.cargo) rec.errores.push('Cargo es obligatorio');
            else if (rec.cargo.length > 100) rec.errores.push('Cargo: máximo 100 caracteres');

            // Funciones
            if (!rec.funciones) rec.errores.push('Funciones es obligatorio');
            else if (rec.funciones.length > 300) rec.errores.push('Funciones: máximo 300 caracteres');

            // País (opcional)
            if (rec.pais && rec.pais.length > 100)
                rec.errores.push('País: máximo 100 caracteres');
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
                : `CAMPOS INCORRECTOS: ${rec.errores.join(', ')}`;
            this.previewData.push(rec);
        }
    }

    // --- Envía toda la carga masiva al API ---
    async sendSolicitudMasiva() {
        if (!this.previewData.length) {
            this.showToastMessage('No hay datos para enviar', 'warn');
            return;
        }

        this.overlayLoaderVisible = true;
        this.carmasivMostrandoLoader = true;
        this.carmasivProgreso = 0;

        const calls = this.previewData.map((item, i) =>
            this.svc.saveUsuarioSolicitud(item).pipe(res => {
                this.carmasivProgreso = Math.round(((i + 1) / this.previewData.length) * 100);
                return res;
            })
        );

        forkJoin(calls).subscribe({
            next: () => {
                this.showToastMessage('Carga masiva completada', 'success');
                // limpia preview si quieres:
                // this.previewData = [];
                // this.selectedFile = undefined;
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

    descargarPDFsMasivos() {
        this.showToastMessage('Función DESCARGAR aún no implementada', '#666');
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

    /** Botón de descarga individual */
    downloadPDF(cedula: ExcelUsuarioRow): void {
        console.log('Download PDF for', cedula);
        // aquí invocarías tu servicio de PDF…
    }

    /** Navegar al detalle/edición */
    irIndividual(cedula: ExcelUsuarioRow): void {
        console.log('Navigate to individual', cedula);
        // por ejemplo:
        // this.router.navigate(['/usuarios', cedula.fill1]);
    }

}
