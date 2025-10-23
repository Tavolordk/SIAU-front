import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators,
  AbstractControl, ValidatorFn, ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from '../../shared/registro-progress/registro-progress';
import { StepFormStateService, Step4State } from '../../step-form/state/step-form-state.service';

function equalsValidator(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const va = group.get(a)?.value ?? '';
    const vb = group.get(b)?.value ?? '';
    if (!va || !vb) return null; // el required se valida aparte
    return (String(va).trim() === String(vb).trim()) ? null : { mismatch: { a, b } };
  };
}

@Component({
  selector: 'app-registro-step4',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step4.html',
  styleUrls: ['./registro-step4.scss']
})
export class RegistroStep4Component implements OnInit {
  // Encabezado / progreso (los recibimos del contenedor)
  @Input() currentStep = 4;
  @Input() maxSteps   = 6;
  @Input() usuarioNombre = 'Luis Vargas';
  @Input() usuarioRol    = 'Capturista';

  @Output() prev = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<void>();

  get totalSteps() { return this.maxSteps; }
  get progressPercent() { return Math.round((this.currentStep / (this.maxSteps || 1)) * 100); }

  icLeft  = faArrowLeft;
  icRight = faArrowRight;

  form!: FormGroup;

  constructor(private fb: FormBuilder, private state: StepFormStateService) {}

  ngOnInit(): void {
    // Valores previos desde el estado (como en el step4 viejo)
    const s1 = this.state.get('step1') ?? {};
    const s4 = this.state.get('step4') ?? {};

    const correoBase   = s4?.correoContacto       ?? s1?.correo ?? '';
    const celularBase  = s4?.celularContacto      ?? '';
    const oficinaBase  = s4?.telOficinaContacto   ?? '';
    const extBase      = s4?.extensionOficina     ?? '';
    const medioVal     = (s4?.medioValidacion ?? 'telegram').toLowerCase();

    this.form = this.fb.group({
      correo:           [correoBase,  [Validators.required, Validators.email]],
      confirmaCorreo:   [correoBase,  [Validators.required, Validators.email]],

      celular:          [celularBase, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      confirmaCelular:  [celularBase, [Validators.required, Validators.pattern(/^\d{10}$/)]],

      // En la versión vieja "oficina" NO es obligatorio
      oficina:          [oficinaBase],
      // Extensión: solo números hasta 10 dígitos (igual que antes)
      extension:        [extBase,     [Validators.pattern(/^\d{1,10}$/)]],

      // En la vieja es un checkbox booleano
      usaTelegram:      [medioVal === 'telegram']
    }, {
      validators: [
        equalsValidator('correo', 'confirmaCorreo'),
        equalsValidator('celular', 'confirmaCelular')
      ]
    });
  }

  private cleanPhone(raw: string | null | undefined): string {
    return (raw ?? '')
      .replace(/\u202A|\u202B|\u202C|\u2066|\u2067|\u2069/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  onBack(): void { this.prev.emit(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const payload: Step4State = {
      correoContacto:      (v.correo ?? '').trim() || null,
      celularContacto:     this.cleanPhone(v.celular),
      telOficinaContacto:  (v.oficina ?? '').trim() || null,
      extensionOficina:    (v.extension ?? '').trim() || null,
      medioValidacion:     v.usaTelegram ? 'telegram' : 'correo'
    };

    // Guarda SOLO el paso 4 (igual que antes)
    this.state.save('step4', payload, true);

    // Avanza
    this.proceed.emit();
  }
}
