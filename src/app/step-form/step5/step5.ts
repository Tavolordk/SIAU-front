import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { FormGroup } from '@angular/forms';
import { switchMap, tap } from 'rxjs/operators';

import { SolicitudesService } from '../../services/solicitudes.service';
import { TelegramGatewayService } from '../../services/telegram-gateway.service';
import { StepFormStateService, OtpCtx } from '../state/step-form-state.service';

@Component({
  selector: 'app-step5',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './step5.html',
  styleUrls: ['./step5.scss']
})
export class Step5Component {
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Input() form!: FormGroup;

  @Output() validate = new EventEmitter<'correo'|'telegram'>();
  @Output() prev     = new EventEmitter<number>();
  @Output() next     = new EventEmitter<number>();

  public faEnvelope = faEnvelope;
  public faTelegramPlane = faTelegramPlane;

  loading = false;

  constructor(
    private solicitudes: SolicitudesService,
    private tg: TelegramGatewayService,
    private state: StepFormStateService
  ) {}

  /** Normaliza número: deja dígitos y +; aplica +52 si no viene prefijo */
  private toE164(raw?: string | null): string | null {
    if (!raw) return null;
    const only = raw.replace(/[^\d+]/g, '').replace(/^\+?/, '').trim(); // quita todo, deja dígitos
    if (only.length < 10) return null;
    return only.startsWith('52') ? `+${only}` : `+52${only}`;          // 🇲🇽 por defecto
  }

  /** Click en “Correo” o “Telegram” */
  onSelect(method: 'correo' | 'telegram') {
    if (method === 'correo') {
      alert('Por ahora usaremos Telegram. (Correo se habilitará después)');
      return;
    }

    // === Telegram ===
    const s4 = this.state.get('step4');
    const to = this.toE164(s4?.celularContacto);            // 👈 número final que usaremos en todo
    if (!to) { alert('Captura un número de celular válido en el Paso 4.'); return; }

    // Guarda el contexto con EXACTAMENTE el mismo contacto que vas a mandar al SP
    const ctx: OtpCtx = { canal: 'telegram', contacto: to, proposito: 'signup' };
    this.state.setOtpCtx(ctx);

    this.loading = true;

    this.solicitudes.solicitarCodigo$('telegram', to, 'signup', 900, 5)
      .pipe(
        tap(r => {
          const code = r?.codigo ?? null;
          this.state.setOtpSim(code);    // QA: para mostrar “(Simulado: …)” en Step6
          this.state.setLastOtp(code);   // guarda último OTP emitido
        }),
        // Envía por el gateway con el MISMO contacto del ctx
        switchMap(r => this.tg.sendCode$(ctx.contacto, r?.codigo ?? '', 'Código:'))
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.next.emit(this.currentStep + 1);             // Ir a Step6
        },
        error: err => {
          this.loading = false;
          console.error(err);
          alert('No se pudo enviar el código por Telegram. Intenta de nuevo.');
        }
      });
  }
}
