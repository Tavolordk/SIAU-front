import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { faCommentDots, faFileLines, faEye } from '@fortawesome/free-solid-svg-icons';
import { PaginationComponent } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-consultar-cedulas',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent, PaginationComponent],
  templateUrl: './consultar-cedulas.html',
  styleUrls: ['./consultar-cedulas.scss']
})
export class ConsultarCedulasComponent implements OnInit{
  ngOnInit(): void {
    this.pageRows = this.rows.slice(0, this.pageSize);
  }
  // Header
  pageSize = 10; 
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';
  trackByFolio = (_: number, r: any) => r.folio;

  icBars = faBars;
  icons = { chevronDown: faChevronDown, comment: faCommentDots,
    file: faFileLines,
    eye: faEye, };

  // cuál panel está abierto
  open: 'personal' | 'solicitud' | 'institucional' | null = null;
row: any;
// Datos de la tabla (mueve aquí tus filas actuales)
rows: any[] = [
  {
    folio: 'PM-2023-02-0195',
    fecha: '2025-03-05',
    nombres: 'Manuel Alejandro',
    primerApellido: 'Lira',
    segundoApellido: 'Blanco',
    usuario: 'u174Q7PL203L',
    tipoSolicitud: 'Reactivación de Cuenta',
    tipoInstitucion: 'Municipal',
    entidadMunicipio: 'Entidad: Coahuila de Zaragoza, municipio: San Juan de Sabinas',
    instDepCorp: 'Institución: Secretaría de Seguridad y Protección Ciudadana, dependencia: Área de Pruebas para Eventos, Corporación: Área de Pruebas para Eventos',
    rnpsp: 'Estatus: Activo, tipo de dependencia: Municipal, dependencia: Secretaría de Seguridad y Protección Ciudadana, entidad: Ciudad de México, municipio: La Magdalena Contreras',
    sau: 'Estatus: Activo, tipo de dependencia: Municipal, dependencia: Secretaría de Seguridad y Protección Ciudadana, entidad: Ciudad de México, municipio: La Magdalena Contreras',
    resultadoEccc: 'Aprobado, vigente',
    estatusTexto: 'Rechazada',
    estatusClase: 'status-rechazada'
  },
  {
    folio: 'PM-2023-02-0106',
    fecha: '2025-03-05',
    nombres: 'Andrea Sofía',
    primerApellido: 'Ramírez',
    segundoApellido: 'Luna',
    usuario: '-----',
    tipoSolicitud: 'Nueva Cuenta',
    tipoInstitucion: 'Federal',
    entidadMunicipio: '-----',
    instDepCorp: 'Institución: Petróleos Mexicanos',
    rnpsp: '-----',
    sau: '-----',
    resultadoEccc: '-----',
    estatusTexto: 'Pendiente',
    estatusClase: 'status-pendiente'
  },
  {
    folio: 'PM-2023-02-0101',
    fecha: '2025-03-06',
    nombres: 'María Fernanda',
    primerApellido: 'López',
    segundoApellido: 'Rodríguez',
    usuario: '-----',
    tipoSolicitud: 'Nueva Cuenta',
    tipoInstitucion: 'Municipal',
    entidadMunicipio: 'Entidad: Chiapas, municipio: Biquipal de Ocampo',
    instDepCorp: 'Institución: Fiscalía General de la República',
    rnpsp: '-----',
    sau: '-----',
    resultadoEccc: '-----',
    estatusTexto: 'Cancelada',
    estatusClase: 'status-cancelada'
  },
  {
    folio: 'PM-2023-02-0102',
    fecha: '2025-03-07',
    nombres: 'José Manuel',
    primerApellido: 'Hernández',
    segundoApellido: 'García',
    usuario: 'u179TQ102G5',
    tipoSolicitud: 'Ampliación de Perfiles',
    tipoInstitucion: 'Estatal',
    entidadMunicipio: 'Entidad: Michoacán de Ocampo',
    instDepCorp: 'Institución: Secretaría de Seguridad y Protección Ciudadana, dependencia: Guardia Nacional, corporación: CESN',
    rnpsp: '-----',
    sau: '-----',
    resultadoEccc: '-----',
    estatusTexto: 'Aprobada',
    estatusClase: 'status-aprobada'
  },
  {
    folio: 'PM-2023-02-0103',
    fecha: '2025-03-07',
    nombres: 'Carlos Alberto',
    primerApellido: 'Martínez',
    segundoApellido: 'Flores',
    usuario: 'u0697H2025K',
    tipoSolicitud: 'Modificación de Perfil / Adscripción',
    tipoInstitucion: 'Estatal',
    entidadMunicipio: 'Entidad: Oaxaca',
    instDepCorp: 'Institución: Secretaría de Seguridad y Protección Ciudadana, dependencia: Centro Nacional de Inteligencia (CNI), corporación: CESN',
    rnpsp: 'Estatus: Activo, tipo de dependencia: Estatal, dependencia: Secretaría de la Defensa Nacional, entidad: Jalisco, municipio: Arandas',
    sau: 'Estatus: Activo, tipo de dependencia: Federal, dependencia: Procuraduría General de Justicia del Estado, entidad: Puebla, municipio: Atlixco',
    resultadoEccc: 'Aprobado, vigente',
    estatusTexto: 'Aprobada',
    estatusClase: 'status-aprobada'
  },
  {
    folio: 'PM-2023-02-0104',
    fecha: '2025-03-07',
    nombres: 'Ana Karen',
    primerApellido: 'Gutiérrez',
    segundoApellido: 'Morales',
    usuario: '-----',
    tipoSolicitud: 'Nueva Cuenta',
    tipoInstitucion: 'Federal',
    entidadMunicipio: '-----',
    instDepCorp: '-----',
    rnpsp: '-----',
    sau: '-----',
    resultadoEccc: '-----',
    estatusTexto: 'Pendiente',
    estatusClase: 'status-pendiente'
  },
  {
    folio: 'PM-2023-02-0105',
    fecha: '2025-03-10',
    nombres: 'Luis Enrique',
    primerApellido: 'Torres',
    segundoApellido: 'Vargas',
    usuario: 'u2597WQ4201T',
    tipoSolicitud: 'Reactivación de Cuenta',
    tipoInstitucion: 'Estatal',
    entidadMunicipio: 'Entidad: México, municipio: Xonacatlán',
    instDepCorp: 'Institución: Secretaría de Seguridad y Protección Ciudadana, dependencia: Centro Nacional de Inteligencia (CNI), corporación: CESN',
    rnpsp: 'Estatus: Activo, tipo de dependencia: Estatal, dependencia: Secretaría de la Defensa Nacional, entidad: Jalisco, municipio: Arandas',
    sau: 'Estatus: Activo, tipo de dependencia: Federal, dependencia: Procuraduría General de Justicia del Estado, entidad: Puebla, municipio: Atlixco',
    resultadoEccc: 'No aprobado, no vigente',
    estatusTexto: 'En espera',
    estatusClase: 'status-espera'
  },
  {
    folio: 'PM-2023-02-0106',
    fecha: '2025-03-10',
    nombres: 'Valeria',
    primerApellido: 'Sánchez',
    segundoApellido: 'Delgado',
    usuario: 'u070VH4201N',
    tipoSolicitud: 'Ampliación de Perfiles',
    tipoInstitucion: 'Estatal',
    entidadMunicipio: 'Entidad: Tamaulipas',
    instDepCorp: 'Institución: Secretaría de Seguridad y Protección Ciudadana, dependencia: Centro Nacional de Inteligencia (CNI), corporación: CESN',
    rnpsp: 'Estatus: Activo, tipo de dependencia: Estatal, dependencia: Secretaría de la Defensa Nacional, entidad: Jalisco, municipio: Arandas',
    sau: 'Estatus: Activo, tipo de dependencia: Federal, dependencia: Procuraduría General de Justicia del Estado, entidad: Puebla, municipio: Atlixco',
    resultadoEccc: 'No aprobado, no vigente',
    estatusTexto: 'Cancelada',
    estatusClase: 'status-cancelada'
  },
  {
    folio: 'PM-2023-02-0108',
    fecha: '2025-03-12',
    nombres: 'Juan Pablo',
    primerApellido: 'Pérez',
    segundoApellido: 'Mendoza',
    usuario: 'u1747HQ2025K',
    tipoSolicitud: 'Modificación de Perfil / Adscripción',
    tipoInstitucion: 'Federal',
    entidadMunicipio: 'Entidad: Guerrero, municipio: Acapulco de Juárez',
    instDepCorp: 'Institución: Consejo Estatal de Seguridad Pública, dependencia: Secretaría de Seguridad Pública, corporación: Policía Estatal',
    rnpsp: 'Estatus: Activo, tipo de dependencia: Estatal, dependencia: Secretaría de Seguridad Pública, entidad: Puebla, municipio: Atlixco',
    sau: '-----',
    resultadoEccc: 'No aprobado, no vigente',
    estatusTexto: 'En espera',
    estatusClase: 'status-espera'
  },
  {
    folio: 'PM-2023-02-0109',
    fecha: '2025-03-12',
    nombres: 'Laura Isabel',
    primerApellido: 'Castillo',
    segundoApellido: 'Nava',
    usuario: '-----',
    tipoSolicitud: 'Nueva Cuenta',
    tipoInstitucion: 'Municipal',
    entidadMunicipio: 'Entidad: Guerrero, municipio: Acapulco de Juárez',
    instDepCorp: 'Institución: Secretaría de Seguridad Pública, dependencia: Dirección General de Prevención y Readaptación Social',
    rnpsp: '-----',
    sau: '-----',
    resultadoEccc: '-----',
    estatusTexto: 'Pendiente',
    estatusClase: 'status-pendiente'
  }
];


/// Slice que se muestra en la página actual
pageRows: any[] = [];

  toggleDropdown(which: 'personal' | 'solicitud' | 'institucional', ev: MouseEvent) {
    ev.stopPropagation();
    this.open = (this.open === which) ? null : which;
  }

  @HostListener('document:click')
  closeAll() { this.open = null; }
  onComment(row?: any){ console.log('comentarios', row); }
  onDocs(row?: any){ console.log('documentos', row); }
  onView(row?: any){ console.log('ver', row); }

  onToggleSidebar() { console.log('toggle sidebar'); }
  onBuscar() { console.log('buscar'); }
  onLimpiar() { console.log('limpiar'); }
  onAprobar() { console.log('aprobar'); }
}
