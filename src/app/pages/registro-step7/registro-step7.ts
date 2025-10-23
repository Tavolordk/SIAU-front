import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faCheckCircle, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { StepFormStateService } from '../../step-form/state/step-form-state.service';

@Component({
  selector: 'app-registro-step7',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step7.html',
  styleUrls: ['./registro-step7.scss'],
  providers: [DatePipe],
})
export class RegistroStep7Component implements OnInit {
  // Header / progreso
  @Input() currentStep = 7;
  @Input() maxSteps = 8;
  @Input() usuarioNombre = 'Luis Vargas';
  @Input() usuarioRol = 'Capturista';
  @Output() back = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>(); // para ir al Step 8

  get totalSteps() { return this.maxSteps; }
  get progressPercent() { return Math.round((this.currentStep / (this.maxSteps || 1)) * 100); }

  // Íconos
  icMail = faEnvelope;
  icTg = faTelegramPlane;
  icCheck = faCheckCircle;
  icPrint = faPrint;

  // Datos del comprobante
  folio = '';
  tipoSolicitud = 'Acceso al SIAU';
  fechaISO = '';
  documentos: string[] = [];

  estatusActual = 'En revisión';
  proximoPaso = 'Validación por el Enlace';
  tiempoEstimado = '3 a 5 días hábiles';

  correoUsuario = '';
  telefonoTelegramUsuario: string | null = null;

  // Contactos de resolución (ajústalos si los tienes en un catálogo)
  contactoResolucionCorreo = 'c.usuariospm@sspc.gob.mx';
  contactoResolucionTelegram = '55-XXXX-XXXX';

  constructor(private state: StepFormStateService, private date: DatePipe) {}

  ngOnInit(): void {
    const r = (this.state.get('receipt') ?? {}) as any;
    this.folio = r.folio ?? 'N/D';
    this.fechaISO = r.fechaISO ?? new Date().toISOString();
    this.documentos = Array.isArray(r.documentos) ? r.documentos : [];
    this.correoUsuario = r.correoUsuario ?? '';
    this.telefonoTelegramUsuario = r.telefonoTelegramUsuario ?? null;
  }

  get fechaHoraTexto(): string {
    return this.date.transform(this.fechaISO, "dd/MM/yyyy HH:mm 'hrs.'") ?? '';
  }

  onPrint() { window.print(); }

  onSendReceiptByEmail() {
    // Aquí podrías llamar a tu servicio para enviar el comprobante por correo
    console.log('Enviar comprobante por correo a', this.correoUsuario);
  }
}
