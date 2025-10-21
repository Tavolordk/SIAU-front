import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface RegistroPersona {
  usuario: string;
  fuenteDatos: 'SAU' | 'SIAU' | string;
  estatus: 'Activo' | 'Inactivo' | string;
  adscripcion: string; // Texto largo
}

export type TipoRequerimientoNg =
  | 'nuevaCuenta'
  | 'modificacionPerfiles'
  | 'ampliacionPerfiles'
  | 'reactivacionCuenta';

export interface ConfirmacionPersonaPayload {
  esPersona: boolean;
  tipoRequerimiento: TipoRequerimientoNg;
}

@Component({
  selector: 'app-confirmacion-persona',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './confirmacion-persona.html',
  styleUrls: ['./confirmacion-persona.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionPersonaComponent {
  @Input() titulo = 'Confirmación de persona';

  @Input() registros: RegistroPersona[] = [
    {
      usuario: 'u15xxxxxx',
      fuenteDatos: 'SAU',
      estatus: 'Activo',
      adscripcion:
        'Tipo de dependencia: Federal, dependencia: Secretaría de Seguridad y Protección Ciudadana, ' +
        'Institución: Guardia Nacional, Entidad: CDMX, Municipio: Álvaro Obregón',
    },
    {
      usuario: 'u15xxxxxx',
      fuenteDatos: 'SAU',
      estatus: 'Inactivo',
      adscripcion:
        'Tipo de dependencia: Federal, dependencia: Secretaría de Seguridad y Protección Ciudadana, ' +
        'Institución: Guardia Nacional, Entidad: CDMX, Municipio: Álvaro Obregón',
    },
    {
      usuario: 'u15xxxxxx',
      fuenteDatos: 'SIAU',
      estatus: 'Activo',
      adscripcion:
        'Tipo de dependencia: Federal, dependencia: Secretaría de Seguridad y Protección Ciudadana, ' +
        'Institución: Guardia Nacional, Entidad: CDMX, Municipio: Álvaro Obregón',
    },
    {
      usuario: 'u15xxxxxx',
      fuenteDatos: 'SIAU',
      estatus: 'Inactivo',
      adscripcion:
        'Tipo de dependencia: Federal, dependencia: Secretaría de Seguridad y Protección Ciudadana, ' +
        'Institución: Guardia Nacional, Entidad: CDMX, Municipio: Álvaro Obregón',
    },
  ];

  @Output() aceptar = new EventEmitter<ConfirmacionPersonaPayload>();

  form!: FormGroup;

// confirmacion-persona.ts
constructor(private fb: FormBuilder) {
  this.form = this.fb.group({
    esPersona: [null as boolean | null, Validators.required],           // true | false
    tipoRequerimiento: [null as TipoRequerimientoNg | null, Validators.required],
  });
}


  get hayRegistros(): boolean {
    return (this.registros?.length ?? 0) > 0;
  }

  onAceptar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { esPersona, tipoRequerimiento } = this.form.value as {
      esPersona: boolean;
      tipoRequerimiento: TipoRequerimientoNg;
    };
    this.aceptar.emit({ esPersona, tipoRequerimiento });
  }
}
