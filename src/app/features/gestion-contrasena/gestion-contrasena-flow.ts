import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { GestionContrasenaComponent } from './gestion-contrasena';
import { NuevaContrasenaComponent } from '../cambio-contrasena/nueva-contrasena/nueva-contrasena';
import { ConfirmacionContrasenaComponent } from '../cambio-contrasena/confirmacion/confirmacion';

import { PasswordFlowStateService } from './password-flow-state.service';
import { LoginActualizarPasswordService } from '../../services/login-actualizar-password.service';
import { ActualizarPasswordResponse } from '../../models/actualizar-password-response.model';

@Component({
  selector: 'app-gestion-contrasena-flow',
  standalone: true,
  imports: [CommonModule, RegistroProgressComponent, GestionContrasenaComponent, NuevaContrasenaComponent, ConfirmacionContrasenaComponent],
  template: `
  <div class="container py-4">
    <app-registro-progress
      [title]="'Gestión de contraseña'"
      [currentStep]="currentStep"
      [totalSteps]="3"
      [percent]="percent"
      [accent]="'#7a2048'">
    </app-registro-progress>

    <!-- Paso 1 -->
    <app-gestion-contrasena
      *ngIf="currentStep===1"
      [showButtons]="false"
      (verificar)="onPaso1Verificar($event)"
      #step1>
    </app-gestion-contrasena>

    <!-- Paso 2 -->
    <app-nueva-contrasena
      *ngIf="currentStep===2"
      [usuarioCuenta]="usuarioCuenta"
      [showButtons]="true"
      [loading]="loading"
      [apiError]="apiError"
      (regresar)="prev()"
      (continuar)="onPaso2Continuar($event)"
      #step2>
    </app-nueva-contrasena>

    <!-- Paso 3 -->
    <app-confirmacion-contrasena
      *ngIf="currentStep===3"
      [showButtons]="false">
    </app-confirmacion-contrasena>
  </div>
  `,
})
export class GestionContrasenaFlowComponent {
  currentStep = 1;
  get percent(): number { return Math.round((this.currentStep / 3) * 100); }

  @ViewChild('step1') step1?: GestionContrasenaComponent;
  @ViewChild('step2') step2?: NuevaContrasenaComponent;

  // 👇 La cuenta del usuario; idealmente viene de sesión/estado global.
  //     Úsala también para mostrar en headers.
  usuarioCuenta = 'tavo.olea';

  // 👇 Estados para la llamada al backend
  loading = false;
  apiError: string | null = null;
  lastResponse?: ActualizarPasswordResponse;

  constructor(private flow: PasswordFlowStateService,
              private api: LoginActualizarPasswordService) { }

  onPaso1Verificar(ev: { currentPassword: string }) {
    this.flow.setPaso1(ev);
    this.currentStep = 2;
  }

  prev() {
    if (this.loading) return;
    if (this.currentStep > 1) this.currentStep--;
  }

  next() {
    if (this.currentStep === 1) {
      const ok = this.step1?.submitFromParent();
      if (!ok) return;
      this.currentStep = 2;
      return;
    }
    if (this.currentStep === 2) {
      const ok = this.step2?.submitFromParent();
      if (!ok) return;
      this.currentStep = 3;
      return;
    }
  }

  finish() { this.flow.clear(); }

onPaso2Continuar(ev: { newPassword: string }) {
  console.log('[Flow] recibido continuar, len=', ev?.newPassword?.length); // 🔎

  this.flow.setPaso2({ codigo: '', nueva: ev.newPassword });

  this.apiError = null;
  this.loading = true;

  const payload = { cuenta: this.usuarioCuenta, contrasena: ev.newPassword };
  console.log('[Flow] POST /actualizar-password →', payload.cuenta); // 🔎

  this.api.cambiar(payload)
    .pipe(finalize(() => {
      this.loading = false;
      console.log('[Flow] finalize'); // 🔎
    }))
    .subscribe({
      next: (resp) => {
        console.log('[Flow] respuesta:', resp); // 🔎
        this.lastResponse = resp;
        if (resp?.success === 1) {
          this.flow.setDone(true);
          this.currentStep = 3;
        } else {
          this.apiError = resp?.message ?? 'No se pudo actualizar la contraseña';
        }
      },
      error: (err) => {
        console.error('[Flow] error:', err); // 🔎
        this.apiError = err?.message ?? 'Error al actualizar la contraseña';
      },
    });
}

}
