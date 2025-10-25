// src/app/features/gestion-contrasena/gestion-contrasena.ts
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faUserCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { PasswordFlowStateService } from './password-flow-state.service';   // 👈 ADD

@Component({
  selector: 'app-gestion-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './gestion-contrasena.html',
  styleUrls: ['./gestion-contrasena.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionContrasenaComponent {
  @Input() headerOffset = 120;
  @Input() showButtons = true;
  @Output() verificar = new EventEmitter<{ currentPassword: string }>();

  form!: FormGroup;
  show = false;

  icons = { bars: faBars, chevronDown: faChevronDown, user: faUserCircle, eye: faEye, eyeSlash: faEyeSlash };
  usuarioCuenta = 'jperez';
  usuarioNombre = 'Octavio Olea';

  // 👇 INYECTA el service
constructor(private fb: FormBuilder, private flow: PasswordFlowStateService) {
    this.form = this.fb.group({ currentPassword: ['', Validators.required] });
  }

  get pwd() { return this.form.get('currentPassword')!; }
  togglePwd() { this.show = !this.show; }

verificarIdentidad() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload = { currentPassword: this.pwd.value! };

    // (opcional) guarda aquí también
    this.flow.setPaso1(payload);

    // avisa al contenedor para que ADELANTE al paso 2
    this.verificar.emit(payload);
  }


  // usado cuando se renderiza standalone
  next() { this.submitFromParent(); }

  submitFromParent(): boolean {
    if (this.form.invalid) { this.form.markAllAsTouched(); return false; }
    this.flow.setPaso1({ currentPassword: this.pwd.value! });
    return true;
  }
}
