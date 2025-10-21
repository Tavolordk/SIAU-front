import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

@Component({
  selector: 'app-registro-step6',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step6.html',
  styleUrls: ['./registro-step6.scss']
})
export class RegistroStep6Component implements OnDestroy {
  // Header
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  // Paso / progreso
  totalSteps = 6;
  currentStep = 5;
  get progressPercent() { return Math.round((this.currentStep / this.totalSteps) * 100); }

  // UI
  icLeft = faArrowLeft;
  channelLabel: 'correo' | 'Telegram' = 'correo'; // Cambia a 'Telegram' si el paso 5 eligió ese canal.

  // Form
  form: FormGroup;

  // Countdown 15 min
  private intervalId: any;
  secondsLeft = 15 * 60; // 900
  get expired() { return this.secondsLeft <= 0; }
  get mmss() {
    const m = Math.floor(this.secondsLeft / 60).toString().padStart(2, '0');
    const s = (this.secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.intervalId = setInterval(() => {
      this.secondsLeft = Math.max(0, this.secondsLeft - 1);
    }, 1000);
  }

  resend() {
    // Aquí reenvías el código por el canal seleccionado (API)
    console.log('Reenviar código por', this.channelLabel);
    this.secondsLeft = 15 * 60; // reinicia validez
  }

  onBack() {
    // router.navigate(['/registro/step5']);
    console.log('Regresar a Step 5');
  }

  verify() {
    if (this.form.invalid || this.expired) return;
    const code = this.form.value.code;
    // TODO: Llama a tu API para verificar el código
    console.log('Verificar código:', code);
    // router.navigate(['/registro/step7']);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
