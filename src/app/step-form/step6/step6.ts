// src/app/step-form/step6/step6.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EMPTY } from 'rxjs';
import { StepFormStateService, OtpCtx } from '../state/step-form-state.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { TelegramGatewayService } from '../../services/telegram-gateway.service';

@Component({
  selector: 'app-step6',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step6.html',
  styleUrls: ['./step6.scss']
})
export class Step6Component implements OnInit {
  @Input() form!: FormGroup;
  @Input() currentStep!: number;
  @Input() maxSteps!: number;

  @Input() simulatedCode: string = ''; // QA
  @Input() folio: string = '';

  @Output() prev = new EventEmitter<number>();
  @Output() verifyOk = new EventEmitter<void>();

  ctx?: OtpCtx;
  loadingVerify = false;
  loadingResend = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private fb: FormBuilder,
    private state: StepFormStateService,
    private api: SolicitudesService,
    private tg: TelegramGatewayService
  ) {}

  ngOnInit(): void {
    // crea form si el contenedor no lo pasó
    if (!this.form) {
      this.form = this.fb.group({
        codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      });
    }

    this.ctx = this.state.get('otpCtx') as OtpCtx | undefined;
    if (!this.ctx) {
      this.errorMsg = 'Falta el contexto de verificación. Regresa al paso anterior.';
      return;
    }

    const sim = this.state.getOtpSim?.() ?? null;
    if (sim) this.simulatedCode = sim;
  }

onVerify(): void {
  this.errorMsg = '';
  this.okMsg = '';
  if (this.form.invalid || this.loadingVerify || !this.ctx) return;

  const codigo = String(this.form.get('codigo')?.value ?? '').trim();
  if (!codigo) { this.errorMsg = 'Ingresa el código.'; return; }

  this.loadingVerify = true;

  this.api.verificarCodigo$(this.ctx.canal, this.ctx.contacto, this.ctx.proposito, codigo)
    .pipe(
      // Si NO es ok → mostramos motivo y cortamos el flujo
      switchMap(r => {
        const ok = !!r?.ok;
        if (!ok) {
          this.errorMsg = this.translateReason(r?.reason);
          this.loadingVerify = false;
          return EMPTY;
        }

        // ✅ marcar medio de validación en el state (lo lee el SP)
        const s4 = this.state.get('step4') ?? {};
        this.state.save('step4', { ...s4, medioValidacion: this.ctx!.canal }, true);

        // ✅ armar el mismo DTO que Step4 y guardar
        const dto = this.api.buildFinalizarRegistroDto(this.state);
        return this.api.guardarStep4(dto);
      })
    )
    .subscribe({
      next: () => {
        this.okMsg = 'Verificado y guardado correctamente.';
        // limpiar simulados/último OTP locales (opcional)
        this.state.setLastOtp?.(null);
        this.state.setOtpSim?.(null);
        this.verifyOk.emit();
      },
      error: () => {
        this.errorMsg = 'El código fue válido, pero no se pudo completar el guardado.';
      },
      complete: () => { this.loadingVerify = false; }
    });
}

  onResend(): void {
    if (!this.ctx || this.loadingResend) return;
    this.errorMsg = '';
    this.okMsg = '';
    this.loadingResend = true;

    this.api.solicitarCodigo$(this.ctx.canal, this.ctx.contacto, this.ctx.proposito, 900, 5)
      .pipe(
        // ✅ guarda también el último OTP emitido
        tap(r => {
          const code = r?.codigo ?? null;
          this.state.setOtpSim?.(code);     // QA: “(Simulado: …)”
          this.state.setLastOtp?.(code);    // último OTP
        }),
        switchMap(r => {
          if (this.ctx!.canal === 'telegram') {
            return this.tg.sendCode$(this.ctx!.contacto, r?.codigo ?? '', 'Código:');
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => { this.okMsg = 'Se envió un nuevo código.'; },
        error: () => { this.errorMsg = 'No se pudo reenviar el código.'; },
        complete: () => { this.loadingResend = false; }
      });
  }

  private translateReason(reason?: string): string {
    switch ((reason ?? '').toLowerCase()) {
      case 'already_used': return 'Ese código ya fue usado.';
      case 'expired': return 'El código expiró.';
      case 'attempts_exceeded': return 'Se alcanzó el máximo de intentos.';
      case 'invalid_code': return 'Código incorrecto.';
      case 'not_found': return 'No hay un código pendiente para validar.';
      default: return 'No se pudo validar el código.';
    }
  }
}
