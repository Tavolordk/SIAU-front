// src/app/models/excel-usuario-row.model.ts
export interface ExcelUsuarioRow {
    areaNombre: string;
    corporacionNombre: string;
    dependenciaNombre: string;
    institucionNombre: string;
    municipioNombre: string;
    entidadNombre: string;
    cuentaUsuario: string | null | undefined;
    curp: string | null | undefined;
    cuip: string | null | undefined;
    nombre2: string | null | undefined;
    fill1: string | null;
    nombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
    rfc: string | null;
    correoElectronico: string | null;
    telefono: string | null;
    tipoUsuario: number | null;
    entidad: number;
    municipio: string | null;
    institucion: number;
    dependencia: number;
    corporacion: number;
    area: number;
    cargo: string | null;
    funciones: string | null;
    pais: string | null;
    entidad2: string | null;
    municipio2: string | null;
    corporacion2: string | null;
    // Los checkboxes de movimiento (nueva cuenta, modificación, etc.)
    checkBox1: boolean;
    checkBox2: boolean;
    checkBox3: boolean;
    checkBox4: boolean;
    checkBox5: boolean;

    // Checkbox de selecció n para descarga
    descargar: boolean;

    // Para no romper tu lógica de envío
    consultaTextos: { [key: string]: string };
    modulosOperacion: { [key: string]: string };
    descripcionerror: string | null;
    ok: boolean;
    errores: string[];
    nombreFirmaUsuario?: string | null;
    nombreFirmaResponsable?: string | null;
    nombreFirmaEnlace?: string | null;
}
