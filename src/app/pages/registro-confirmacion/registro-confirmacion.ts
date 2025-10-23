import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faEnvelope, faFile } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { StepFormStateService } from '../../step-form/state/step-form-state.service';

@Component({
  selector: 'app-registro-confirmacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './registro-confirmacion.html',
  styleUrls: ['./registro-confirmacion.scss'],
})
export class RegistroConfirmacionComponent implements OnInit {
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  icCheck = faCheckCircle;
  icMail  = faEnvelope;
  icTg    = faTelegramPlane;
  icFile  = faFile;

  folio = '';
  tipoSolicitud = 'Acceso al SIAU';
  fechaHora = '';
  documentos: string[] = [];

  estatusActual = 'En revisión';
  proximoPaso   = 'Validación por el Enlace';
  tiempoEstimado = '3 a 5 días hábiles';

  contactoResolucionCorreo = 'c.usuariospm@sspc.gob.mx';
  contactoResolucionTelegram = '55-XXXX-XXXX';
  mesaServicio = '55-1103-6000 (ext. 12345)';
  correoMesa   = 'mesadeservicios@sspc.gob.mx';

  constructor(private state: StepFormStateService) {}

  ngOnInit(): void {
    const r = (this.state.get('receipt') ?? {}) as any;
    this.folio = r.folio ?? 'N/D';
    const f = r.fechaISO ? new Date(r.fechaISO) : new Date();
    this.fechaHora = `${f.toLocaleDateString()}  ${f.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} hrs.`;
    this.documentos = Array.isArray(r.documentos) ? r.documentos : [];
  }
}
