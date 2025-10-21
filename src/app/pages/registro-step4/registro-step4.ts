import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

function match(otherControlName: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const parent = ctrl.parent as FormGroup | null;
    if (!parent) return null;
    const other = parent.get(otherControlName);
    if (!other) return null;
    return other.value === ctrl.value ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-registro-step4',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step4.html',
  styleUrls: ['./registro-step4.scss']
})
export class RegistroStep4Component {
  // Header (demo)
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  // Paso / progreso
  totalSteps = 8;
  currentStep = 4;
  get progressPercent() { return Math.round((this.currentStep / this.totalSteps) * 100); }

  // Icons
  icLeft  = faArrowLeft;
  icRight = faArrowRight;

  // Form
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      correo2: ['', [Validators.required, Validators.email, match('correo')]],

      celular: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      celular2: ['', [Validators.required, Validators.pattern(/^\d{10}$/), match('celular')]],

      oficina: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      extension: [''],

      app: ['telegram'] // valor por defecto
    });
  }

  get f() { return this.form.controls; }

  onBack() {
    // TODO: router.navigate(['/registro/step3']);
    console.log('Regresar a Step 3');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: guardar / navegar
    console.log('Step 4 OK', this.form.value);
    // router.navigate(['/registro/step5']);
  }
}