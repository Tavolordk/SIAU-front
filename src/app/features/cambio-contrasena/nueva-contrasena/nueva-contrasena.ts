import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfoCircle, faShieldAlt, faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faUserCircle as faUserCircleRegular } from '@fortawesome/free-regular-svg-icons';
import { PasswordFlowStateService } from '../../gestion-contrasena/password-flow-state.service';

// ----- Validadores -----
function passwordComplexity(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value ?? '') as string;
  if (!v) return { required: true };
  const okLen = v.length >= 8;
  const okNum = /\d/.test(v);
  const okSpec = /[^A-Za-z0-9]/.test(v);
  const okUpper = /[A-Z]/.test(v);
  const okLower = /[a-z]/.test(v);
  return okLen && okNum && okSpec && okUpper && okLower ? null
    : { complexity: { okLen, okNum, okSpec, okUpper, okLower } };
}
function matchWith(otherName: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const parent = ctrl.parent;
    if (!parent) return null;
    return parent.get(otherName)?.value === ctrl.value ? null : { nomatch: true };
  };
}

@Component({
  selector: 'app-nueva-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './nueva-contrasena.html',
  styleUrls: ['./nueva-contrasena.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaContrasenaComponent {
  @Input() headerOffset = 110;
  @Input() usuarioNombre = 'Octavio Olea';
  @Input() usuarioCuenta  = 'tavo.olea';
@Input() loading = false;
@Input() apiError: string | null = null;
  @Input() showButtons = true;
  @Output() regresar  = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<{ newPassword: string }>();

  // ✅ declarar y crear en constructor
  form!: FormGroup;

  constructor(private fb: FormBuilder, private flow: PasswordFlowStateService) {
    this.form = this.fb.group({
      newPassword: ['', [passwordComplexity]],
      confirmPassword: ['', [Validators.required, matchWith('newPassword')]],
    });
  }

  show1 = false;
  show2 = false;

  icons = {
    user: faUserCircleRegular,
    info: faInfoCircle,
    shield: faShieldAlt,
    eye: faEye,
    eyeSlash: faEyeSlash,
    back: faArrowLeft,
  };

  get f()   { return this.form.controls; }
  get pwd() { return this.f['newPassword']; }
  get pwd2(){ return this.f['confirmPassword']; }

  get rqLen()   { return (this.pwd.value || '').length >= 8; }
  get rqNum()   { return /\d/.test(this.pwd.value || ''); }
  get rqSpec()  { return /[^A-Za-z0-9]/.test(this.pwd.value || ''); }
  get rqUpper() { return /[A-Z]/.test(this.pwd.value || ''); }
  get rqLower() { return /[a-z]/.test(this.pwd.value || ''); }

  get strength(): string {
    const score = [this.rqLen, this.rqNum, this.rqSpec, this.rqUpper, this.rqLower].filter(Boolean).length;
    return ['Muy débil','Débil','Regular','Buena','Fuerte'][Math.max(0, score - 1)];
  }

  onRegresar() { this.regresar.emit(); }

onContinuar() {
  // 🔎 Log de depuración: confirma si se está haciendo click
  console.log('[NuevaContrasena] click Continuar, form.valid=', this.form.valid);

  if (!this.form.valid) {
    // deja rastro para ver qué falla exactamente
    console.log('[NuevaContrasena] errores:', this.form.errors, this.pwd.errors, this.pwd2.errors);
  }

  if (this.submitFromParent()) {
    console.log('[NuevaContrasena] emitiendo continuar');
    this.continuar.emit({ newPassword: this.pwd.value });
  }
}


  submitFromParent(): boolean {
    if (this.form.invalid) { this.form.markAllAsTouched(); return false; }
    this.flow.setPaso2({ codigo: '', nueva: this.pwd.value });
    this.flow.setDone(true);
    return true;
  }
}
