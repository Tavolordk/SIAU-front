import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faUserCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from "../../shared/header-siau/header-siau";

@Component({
  selector: 'app-gestion-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './gestion-contrasena.html',
  styleUrls: ['./gestion-contrasena.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionContrasenaComponent {
  /** Altura del header para alinear el sidebar fijo */
  @Input() headerOffset = 120;

  @Output() verificar = new EventEmitter<{ currentPassword: string }>();

  form!:FormGroup;

  show = false;

  icons = {
    bars: faBars,
    chevronDown: faChevronDown,
    user: faUserCircle,
    eye: faEye,
    eyeSlash: faEyeSlash,
  };
usuarioCuenta: string='jperez';
usuarioNombre: string='Juan Pérez';

  constructor(private fb: FormBuilder) {
    this.form=this.fb.group({
    currentPassword: ['', Validators.required],
  });
  }

  get pwd() { return this.form.get('currentPassword')!; }

  togglePwd() { this.show = !this.show; }

  verificarIdentidad() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.verificar.emit({ currentPassword: this.pwd.value! });
  }
}
