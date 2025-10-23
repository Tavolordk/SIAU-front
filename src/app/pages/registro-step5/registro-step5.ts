import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';

import { SolicitudesService } from '../../services/solicitudes.service';
import { TelegramGatewayService } from '../../services/telegram-gateway.service';
import { StepFormStateService, OtpCtx } from '../../step-form/state/step-form-state.service';
import { switchMap, tap } from 'rxjs/operators';

type Canal = 'correo' | 'telegram';

@Component({
  selector: 'app-registro-step5',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step5.html',
  styleUrls: ['./registro-step5.scss']
})
export class RegistroStep5Component {
  // Header / progreso
  @Input() currentStep = 5;
  @Input() maxSteps = 6;
  @Input() usuarioNombre = 'Luis Vargas';
  @Input() usuarioRol = 'Capturista';
  @Output() proceed = new EventEmitter<Canal>();   // avanza a Step6 con el canal elegido
  @Output() prev = new EventEmitter<void>();

  get totalSteps() { return this.maxSteps; }
  get progressPercent() { return Math.round((this.currentStep / (this.maxSteps || 1)) * 100); }

  icMail = faEnvelope;
  icTelegram = faTelegramPlane;

  loading = false;

  constructor(
    private solicitudes: SolicitudesService,
    private tg: TelegramGatewayService,
    private state: StepFormStateService
  ) {}

  private toE164(raw?: string | null): string | null {
    if (!raw) return null;
    const only = raw.replace(/[^\d+]/g, '').replace(/^\+?/, '').trim();
    if (only.length < 10) return null;
    return only.startsWith('52') ? `+${only}` : `+52${only}`;
  }

  onBack() { this.prev.emit(); }

  /** Click en los botones. Acepta 'email' para no tocar tu HTML si ya está así. */
  onSelect(channel: Canal | 'email') {
    const canal: Canal = channel === 'email' ? 'correo' : channel;

    if (canal === 'correo') {
      const s4 = this.state.get('step4');
      const email = s4?.correoContacto || this.state.get('step1')?.correo || '';
      if (!email) { alert('Captura un correo válido en el Paso 4.'); return; }

      const ctx: OtpCtx = { canal: 'correo', contacto: email, proposito: 'signup' };
      this.state.setOtpCtx(ctx);

      this.loading = true;
      this.solicitudes.solicitarCodigo$('correo', email, 'signup', 900, 5)
        .pipe(
          tap(r => {
            const code = r?.codigo ?? null;
            this.state.setOtpSim(code);     // para QA
            this.state.setLastOtp(code);
          })
          // correo lo envía el backend; no hay gateway adicional
        )
        .subscribe({
          next: () => { this.loading = false; this.proceed.emit('correo'); },
          error: (err) => { this.loading = false; console.error(err); alert('No se pudo enviar el código por correo.'); }
        });

      return;
    }

    // === Telegram ===
    const s4 = this.state.get('step4');
    const to = this.toE164(s4?.celularContacto);
    if (!to) { alert('Captura un número de celular válido en el Paso 4.'); return; }

    const ctx: OtpCtx = { canal: 'telegram', contacto: to, proposito: 'signup' };
    this.state.setOtpCtx(ctx);

    this.loading = true;
    this.solicitudes.solicitarCodigo$('telegram', to, 'signup', 900, 5)
      .pipe(
        tap(r => {
          const code = r?.codigo ?? null;
          this.state.setOtpSim(code);
          this.state.setLastOtp(code);
        }),
        switchMap(r => this.tg.sendCode$(ctx.contacto, r?.codigo ?? '', 'Código:'))
      )
      .subscribe({
        next: () => { this.loading = false; this.proceed.emit('telegram'); },
        error: (err) => { this.loading = false; console.error(err); alert('No se pudo enviar el código por Telegram.'); }
      });
  }
}
