import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

/**
 * Modelo de datos para la cédula, con todos los campos que puedan venir nulos.
 */
export interface CedulaModel {
  fill1?: string | null;
  folio?: string | null;
  cuentaUsuario?: string | null;
  correoElectronico?: string | null;
  telefono?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  nombre?: string | null;
  nombre2?: string | null;
  rfc?: string | null;
  cuip?: string | null;
  curp?: string | null;
  tipoUsuario?: number | null;
  entidad?: number | null;
  municipio?: number | null;
  institucion?: number | null;
  corporacion?: number | null;
  area?: number | null;
  cargo?: string | null;
  funciones?: string | null;
  funciones2?: string | null;
  pais?: string | null;
  entidad2?: number | null;
  municipio2?: number | null;
  corporacion2?: number | null;
  consultaTextos?: Record<string, string> | null;
  modulosOperacion?: Record<string, string> | null;
  checkBox1?: boolean | null;
  checkBox2?: boolean | null;
  checkBox3?: boolean | null;
  checkBox4?: boolean | null;
  checkBox5?: boolean | null;
  entidadNombre?: string;
  municipioNombre?: string;
  institucionNombre?: string;
  dependenciaNombre?: string;
  corporacionNombre?: string;
  areaNombre?: string;
  entidad2Nombre?: string;
  municipio2Nombre?: string;
  corporacion2Nombre?: string;
  nombreFirmaUsuario?: string | null;
  nombreFirmaResponsable?: string | null;
  nombreFirmaEnlace?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor() {}

  /**
   * Genera y descarga el PDF en el cliente usando la plantilla y los datos.
   * Todos los campos nulos o undefined se convierten en cadenas vacías.
   */
async generarYDescargar(datos: CedulaModel): Promise<void> {
  const pdfBytes = await this.generar(datos);
  const toText = (v: string | number | null | undefined): string => {
    if (v == null) return '';
    if (typeof v === 'number') return v === 0 ? '' : String(v);
    return String(v);
  };
  saveAs(
    new Blob([pdfBytes], { type: 'application/pdf' }),
    `CED_${toText(datos.nombre).trim()}_${toText(datos.apellidoPaterno).trim()}_${toText(datos.apellidoMaterno).trim()}.pdf`
  );
}

  /** devuelve el PDF como bytes sin descargarlo */
async generar(datos: CedulaModel): Promise<Uint8Array> {
  const toText = (v: string | number | null | undefined): string => {
    if (v == null) return '';
    if (typeof v === 'number') return v === 0 ? '' : String(v);
    return String(v);
  };

  const url = `/assets/pdf/cue.pdf?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error al cargar plantilla PDF: ${res.status}`);
  const tpl = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.load(tpl);
  const form = pdfDoc.getForm();

  form.getTextField('fill_1').setText(toText(datos.fill1));
  form.getTextField('Cuenta de Usuario').setText(toText(datos.cuentaUsuario));
  form.getTextField('Correo Electrónico').setText(toText(datos.correoElectronico).toUpperCase());
  form.getTextField('Teléfono').setText(toText(datos.telefono));
  form.getTextField('undefined').setText(toText(datos.apellidoPaterno));
  form.getTextField('undefined_2').setText(toText(datos.apellidoMaterno));
  form.getTextField('undefined_3').setText(toText(datos.nombre));
  form.getTextField('undefined_4').setText(toText(datos.nombre2));
  form.getTextField('undefined_5').setText(toText(datos.rfc));

  const hoy = new Date();
  form.getTextField('DÍA').setText(hoy.getDate().toString().padStart(2,'0'));
  form.getTextField('MES').setText((hoy.getMonth()+1).toString().padStart(2,'0'));
  form.getTextField('AÑO').setText(hoy.getFullYear().toString());

  form.getTextField('undefined_6').setText(toText(datos.cuip));
  form.getTextField('undefined_7').setText(toText(datos.curp));

  ['Check Box1','Check Box2','Check Box3','Check Box4','Check Box5']
    .forEach((field, i) => {
      const cb = form.getCheckBox(field);
      (datos[`checkBox${i+1}` as keyof CedulaModel]) ? cb.check() : cb.uncheck();
    });

  const grupo = form.getRadioGroup('Group6');
  if (grupo && typeof datos.tipoUsuario === 'number') {
    const options = grupo.getOptions();
    const opt = `Opción${datos.tipoUsuario}`;
    if (options.includes(opt)) grupo.select(opt);
  }

  form.getTextField('Entidad').setText(toText(datos.entidadNombre));
  form.getTextField('Municipio').setText(toText(datos.municipioNombre));
  form.getTextField('Institución').setText(toText(datos.institucionNombre));
  form.getTextField('Coorporación').setText(toText(datos.corporacionNombre));
  form.getTextField('Área').setText(toText(datos.areaNombre));
  form.getTextField('Cargo').setText(toText(datos.cargo));
  form.getTextField('Funciones').setText(toText(datos.funciones));
  form.getTextField('Funciones 2').setText(toText(datos.funciones2));
  form.getTextField('Pais').setText(toText(datos.pais));
  form.getTextField('Entidad_2').setText(toText(datos.entidad2Nombre));
  form.getTextField('Municipio_2').setText(toText(datos.municipio2Nombre));
  form.getTextField('Corporación').setText(toText(datos.corporacion2Nombre));

  Object.entries(datos.consultaTextos || {}).forEach(([key,val]) => {
    form.getTextField(key).setText(toText(val));
  });
  Object.entries(datos.modulosOperacion || {}).forEach(([key,val]) => {
    form.getTextField(key).setText(toText(val));
  });

  form.getTextField('Text2').setText(toText(datos.nombreFirmaUsuario));
  form.getTextField('Text3').setText(toText(datos.nombreFirmaResponsable));
  form.getTextField('Text4').setText(toText(datos.nombreFirmaEnlace));

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

}
