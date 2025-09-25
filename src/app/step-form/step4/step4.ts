import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators,
  AbstractControl, ValidatorFn, ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { StepFormStateService, Step4State } from '../state/step-form-state.service';

@Component({
  selector: 'app-step4',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step4.html',
  styleUrls: ['./step4.scss']
})
export class Step4Component implements OnInit {
  @Input() currentStep!: number;
  @Input() maxSteps!: number;

  /** Si el padre no lo pasa, se crea aquí */
  @Input() form!: FormGroup;

  @Output() prev = new EventEmitter<number>();
  @Output() next = new EventEmitter<number>();

  constructor(private fb: FormBuilder, private state: StepFormStateService) {}

  ngOnInit(): void {
    const s1 = this.state.get('step1') ?? {};
    const s4 = this.state.get('step4') ?? {};

    const correoBase   = s4?.correoContacto    ?? s1?.correo ?? '';
    const celularBase  = s4?.celularContacto   ?? '';
    const oficinaBase  = s4?.telOficinaContacto ?? '';
    const extBase      = s4?.extensionOficina   ?? '';
    const medioVal     = (s4?.medioValidacion ?? 'telegram').toLowerCase();

    this.form = this.fb.group({
      correo:           [correoBase,   [Validators.required, Validators.email]],
      confirmaCorreo:   [correoBase,   [Validators.required, Validators.email]],
      celular:          [celularBase,  [Validators.required, Validators.pattern(/^\d{10,}$/)]],
      confirmaCelular:  [celularBase,  [Validators.required, Validators.pattern(/^\d{10,}$/)]],
      oficina:          [oficinaBase],
      extension:        [extBase,      [Validators.pattern(/^\d{1,10}$/)]],
      usaTelegram:      [medioVal === 'telegram']
    }, {
      validators: [
        equalsValidator('correo', 'confirmaCorreo'),
        equalsValidator('celular', 'confirmaCelular')
      ]
    });
  }

  get f(): { [k: string]: AbstractControl } { return this.form.controls; }

  /** Limpia espacios y caracteres invisibles */
  private cleanPhone(raw: string | null | undefined): string {
    return (raw ?? '')
      .replace(/\u202A|\u202B|\u202C|\u2066|\u2067|\u2069/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  onNext(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const payload: Step4State = {
      correoContacto:      (v.correo ?? '').trim() || null,
      celularContacto:     this.cleanPhone(v.celular),
      telOficinaContacto:  (v.oficina ?? '').trim() || null,
      extensionOficina:    (v.extension ?? '').trim() || null,
      medioValidacion:     v.usaTelegram ? 'telegram' : 'correo'
    };

    // Guarda SOLO el paso 4 (los pasos previos ya están guardados en el state)
    this.state.save('step4', payload, true);

    // Avanza a Step 5 (elección/solicitud de código)
    this.next.emit(this.currentStep + 1);
  }
}

/** Validador de igualdad para pares (correo/confirmación, celular/confirmación) */
function equalsValidator(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const va = group.get(a)?.value ?? '';
    const vb = group.get(b)?.value ?? '';
    if (!va || !vb) return null; // el required se valida aparte
    return (String(va).trim() === String(vb).trim()) ? null : { mismatch: { a, b } };
  };
}
