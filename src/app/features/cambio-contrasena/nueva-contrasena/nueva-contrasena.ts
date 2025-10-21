import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars, faChevronDown, faInfoCircle, faShieldAlt, faArrowLeft,
  faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { faUserCircle as faUserCircleRegular } from '@fortawesome/free-regular-svg-icons';
import { HeaderSiauComponent } from '../../../shared/header-siau/header-siau';

/* --- Validadores personalizados --- */
function passwordComplexity(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value ?? '') as string;
  if (!v) return { required: true };
  const okLen = v.length >= 8;
  const okNum = /\d/.test(v);
  const okSpec = /[^A-Za-z0-9]/.test(v);
  const okUpper = /[A-Z]/.test(v);
  const okLower = /[a-z]/.test(v);
  return okLen && okNum && okSpec && okUpper && okLower ? null : {
    complexity: { okLen, okNum, okSpec, okUpper, okLower }
  };
}

function matchWith(otherName: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const parent = ctrl.parent;
    if (!parent) return null;
    const a = parent.get(otherName)?.value;
    const b = ctrl.value;
    return a === b ? null : { nomatch: true };
  };
}

@Component({
  selector: 'app-nueva-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './nueva-contrasena.html',
  styleUrls: ['./nueva-contrasena.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaContrasenaComponent {
  @Input() headerOffset = 110;
  @Input() usuarioNombre = 'Juan Pérez';
  @Input() usuarioCuenta = 'U123456';

  @Output() regresar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<{ newPassword: string }>();

  form: FormGroup;

  show1 = false;
  show2 = false;

  icons = {
    bars: faBars,
    chevronDown: faChevronDown,
    user: faUserCircleRegular,
    info: faInfoCircle,
    shield: faShieldAlt,
    eye: faEye,
    eyeSlash: faEyeSlash,
    back: faArrowLeft,
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      newPassword: ['', [passwordComplexity]],
      confirmPassword: ['', [Validators.required, matchWith('newPassword')]]
    });
  }

  get f() { return this.form.controls; }
  get pwd() { return this.f['newPassword']; }
  get pwd2() { return this.f['confirmPassword']; }

  // Requisitos (para pintar la lista)
  get rqLen()   { return (this.pwd.value || '').length >= 8; }
  get rqNum()   { return /\d/.test(this.pwd.value || ''); }
  get rqSpec()  { return /[^A-Za-z0-9]/.test(this.pwd.value || ''); }
  get rqUpper() { return /[A-Z]/.test(this.pwd.value || ''); }
  get rqLower() { return /[a-z]/.test(this.pwd.value || ''); }

  // Texto de fortaleza muy simple (puedes refinar si quieres)
  get strength(): string {
    const score = [this.rqLen, this.rqNum, this.rqSpec, this.rqUpper, this.rqLower].filter(Boolean).length;
    return ['Muy débil','Débil','Regular','Buena','Fuerte'][Math.max(0, score - 1)];
  }

  onRegresar() { this.regresar.emit(); }
  onContinuar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.continuar.emit({ newPassword: this.pwd.value });
  }
}
