import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faCheckCircle, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

@Component({
  selector: 'app-registro-step7',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step7.html',
  styleUrls: ['./registro-step7.scss'],
  providers: [DatePipe],
})
export class RegistroStep7Component {
  // Header (demo)
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Cultura';

  // Paso / progreso (7 de 8 para mantener consistencia con tus pasos)
  totalSteps = 6;
  currentStep = 6;
  get progressPercent() { return Math.round((this.currentStep / this.totalSteps) * 100); }

  // Íconos
  icMail = faEnvelope;
  icTg = faTelegramPlane;
  icCheck = faCheckCircle;
  icPrint = faPrint;

  // Datos de la confirmación (ejemplo)
  folio = 'PM-2025-05-78456';
  tipoSolicitud = 'Acceso al SIAU';
  fechaHoraTexto = '15/05/2023 14:35 hrs.'; // puedes calcularlo dinámicamente si lo prefieres
  documentos = ['INE_Usuario.pdf', 'Credencial_Laboral.pdf', 'Recibo_Nomina_Octubre.pdf'];

  // Proceso de revisión
  estatusActual = 'En revisión';
  proximoPaso = 'Validación por el Enlace';
  tiempoEstimado = '3 a 5 días hábiles';

  // Canales de contacto
  contactoResolucionCorreo = 'c.usuariospm@sspc.gob.mx';
  contactoResolucionTelegram = '55-XXXX-XXXX';
  correoUsuario = 'correo@ejemplo.com'; // correo registrado
  telefonoTelegramUsuario = '55-XXXX-XXXX'; // si tiene Telegram

  // Actions
  onPrint() {
    window.print();
  }

  onSendReceiptByEmail() {
    // TODO: dispara envío de comprobante por correo
    console.log('Enviar comprobante por correo al usuario');
  }
}
