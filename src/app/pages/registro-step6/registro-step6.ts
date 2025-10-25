import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';

import { SolicitudesService } from '../../services/solicitudes.service';
import { TelegramGatewayService } from '../../services/telegram-gateway.service';
import { StepFormStateService, OtpCtx } from '../../step-form/state/step-form-state.service';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-registro-step6',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step6.html',
  styleUrls: ['./registro-step6.scss']
})
export class RegistroStep6Component implements OnInit, OnDestroy {
  // Header / progreso
  @Input() currentStep = 6;
  @Input() maxSteps = 6;
  @Input() usuarioNombre = 'Octavio Olea';
  @Input() usuarioRol = 'Administrador';

  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<void>();   // al siguiente paso (7)

  get totalSteps() { return this.maxSteps; }
  get progressPercent() { return Math.round((this.currentStep / (this.maxSteps || 1)) * 100); }

  icLeft = faArrowLeft;

  form!: FormGroup;

  // estado OTP
  ctx: OtpCtx | null = null;
  otpSim: string | null = null;      // para mostrar en QA, si lo guardaste en el state
  channelLabel: 'correo' | 'Telegram' = 'correo';

  // Countdown (15 min)
  private intervalId: any;
  secondsLeft = 15 * 60;
  get expired() { return this.secondsLeft <= 0; }
  get mmss() {
    const m = Math.floor(this.secondsLeft / 60).toString().padStart(2, '0');
    const s = (this.secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  loading = false;

  constructor(
    private fb: FormBuilder,
    private solicitudes: SolicitudesService,
    private tg: TelegramGatewayService,
    private state: StepFormStateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // Recupera el contexto del paso 5
    this.ctx = this.state.getOtpCtx ? this.state.getOtpCtx() : (this.state as any).otpCtx ?? null;
    this.otpSim = this.state.getOtpSim ? this.state.getOtpSim() : (this.state as any).otpSim ?? null;

    if (this.ctx?.canal === 'telegram') this.channelLabel = 'Telegram';
    else this.channelLabel = 'correo';

    // Arranca el timer
    this.intervalId = setInterval(() => {
      this.secondsLeft = Math.max(0, this.secondsLeft - 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  onBack() { this.prev.emit(); }

  resend() {
    if (!this.ctx) return;
    this.loading = true;

    this.solicitudes.solicitarCodigo$(this.ctx.canal, this.ctx.contacto, this.ctx.proposito ?? 'signup', 900, 5)
      .pipe(
        tap(r => {
          const code = r?.codigo ?? null;
          this.state.setOtpSim(code);
          this.state.setLastOtp(code);
        }),
        switchMap(r => {
          if (this.ctx!.canal === 'telegram') {
            return this.tg.sendCode$(this.ctx!.contacto, r?.codigo ?? '', 'Código:');
          }
          // correo: ya lo envía el backend
          return [null] as any;
        })
      )
      .subscribe({
        next: () => { this.loading = false; this.secondsLeft = 15 * 60; },
        error: (err) => { this.loading = false; console.error(err); alert('No se pudo reenviar el código.'); }
      });
  }

  verify() {
    if (this.form.invalid || this.expired || !this.ctx) return;
    const code = String(this.form.value.code || '').trim();

    this.loading = true;

    // Si tu API tiene verificación, úsala:
    // this.solicitudes.verificarCodigo$(this.ctx.canal, this.ctx.contacto, code)
    //   .subscribe({ next: () => { ... }, error: () => { ... } });

    // Fallback de QA: compara contra el último OTP guardado
    const last = this.state.getLastOtp ? this.state.getLastOtp() : (this.state as any).lastOtp;
    const ok = !!last && String(last) === code;

    setTimeout(() => {
      this.loading = false;
      if (!ok) {
        alert('Código incorrecto o expirado.');
        return;
      }
      this.proceed.emit();   // avanza a Step 7
    }, 400);
  }
}
