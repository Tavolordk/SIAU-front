import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faEnvelope, faFile } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';

// Usa la misma ruta que ya usas en tu proyecto para el header
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';

@Component({
  selector: 'app-registro-confirmacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './registro-confirmacion.html',
  styleUrls: ['./registro-confirmacion.scss'],
})
export class RegistroConfirmacionComponent {
  // Header
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Cultura';

  // Íconos
  icCheck = faCheckCircle;
  icMail  = faEnvelope;
  icTg    = faTelegramPlane;
  icFile  = faFile;

  // Datos de confirmación
  folio = 'PM-2025-05-78456';
  tipoSolicitud = 'Acceso al SIAU';
  fechaHora = '15/05/2023  14:35 hrs.';
  documentos = ['INE_Usuario.pdf', 'Credencial_Laboral.pdf', 'Recibo_Nomina_Octubre.pdf'];

  // Proceso de revisión
  estatusActual = 'En revisión';
  proximoPaso   = 'Validación por el Enlace';
  tiempoEstimado = '3 a 5 días hábiles';

  // Resolución/contacto
  contactoResolucionCorreo = 'c.usuariospm@sspc.gob.mx';
  contactoResolucionTelegram = '55-XXXX-XXXX';
  mesaServicio = '55-1103-6000 (ext. 12345)';
  correoMesa   = 'mesadeservicios@sspc.gob.mx';
}
