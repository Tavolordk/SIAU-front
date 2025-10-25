import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faCheckCircle, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { StepFormStateService } from '../../step-form/state/step-form-state.service';
import { finalize } from 'rxjs/operators';

// 👇 Servicio de correo
import { UsuariosCorreoService } from '../../services/usuarios-correo.service'; 

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
  @Input() usuarioNombre = 'Octavio Olea';
  @Input() usuarioRol = 'Administrador';
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

  // Datos de contacto del usuario
  correoUsuario = '';
  telefonoTelegramUsuario: string | null = null;

  // Contactos de resolución (si después vienen de un catálogo, se sustituyen)
  contactoResolucionCorreo = 'c.usuariospm@sspc.gob.mx';
  contactoResolucionTelegram = '55-XXXX-XXXX';

  // Estado de envío de correo
  emailSending = false;
  emailOk = false;
  emailError: string | null = null;

  // Nombre completo calculado (para el correo)
  private nombreUsuarioCompleto = '';

  // Inyecciones
  private state = inject(StepFormStateService);
  private date = inject(DatePipe);
  private correoSvc = inject(UsuariosCorreoService);

  ngOnInit(): void {
    const r = (this.state.get('receipt') ?? {}) as any;
    this.folio = r.folio ?? 'N/D';
    this.fechaISO = r.fechaISO ?? new Date().toISOString();
    this.documentos = Array.isArray(r.documentos) ? r.documentos : [];
    this.correoUsuario = r.correoUsuario ?? '';
    this.telefonoTelegramUsuario = r.telefonoTelegramUsuario ?? null;

    // Nombre completo desde step1 (si no, usa el @Input usuarioNombre)
    const s1 = (this.state.get('step1') ?? {}) as any;
    this.nombreUsuarioCompleto = [
      s1?.nombre,
      s1?.primerApellido,
      s1?.segundoApellido,
    ].filter(Boolean).join(' ').trim() || this.usuarioNombre;
  }

  get fechaHoraTexto(): string {
    return this.date.transform(this.fechaISO, "dd/MM/yyyy HH:mm 'hrs.'") ?? '';
  }

  onPrint() { window.print(); }

  /** Código a enviar. Si luego lo guardas en el state, cámbialo aquí. */
  private resolveCodigo(): string {
    // Si más adelante lo persistes, intenta leerlo del state o localStorage.
    // const fromState = (this.state.get('otp') ?? this.state.get('codigo')) as string | null;
    // return (fromState && fromState.trim()) ? fromState : '123456';
    return '123456'; // ✅ Como lo pediste: fijo por ahora
  }

  onSendReceiptByEmail() {
    this.emailError = null;
    this.emailOk = false;

    if (!this.correoUsuario) {
      this.emailError = 'No hay correo electrónico del usuario.';
      return;
    }

    this.emailSending = true;

    this.correoSvc.enviarCodigo(this.resolveCodigo(), this.nombreUsuarioCompleto, this.correoUsuario)
      .pipe(finalize(() => this.emailSending = false))
      .subscribe({
        next: () => { this.emailOk = true; },
        error: (e) => { this.emailError = e?.message ?? 'No se pudo enviar el correo.'; }
      });
  }
}
