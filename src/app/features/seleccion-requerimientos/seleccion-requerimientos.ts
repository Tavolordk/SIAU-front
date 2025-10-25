import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type TipoRequerimiento =
  | 'NUEVA_CUENTA'
  | 'MODIFICACION'
  | 'AMPLIACION'
  | 'REACTIVACION';

@Component({
  selector: 'app-seleccion-requerimientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seleccion-requerimientos.html',
  styleUrls: ['./seleccion-requerimientos.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeleccionRequerimientosComponent {
  // Info del encabezado blanco
  @Input() usuarioId = 'U123456';
  @Input() folio = 'PM-2023-00161';
  @Input() fecha = '20/05/2025';
  @Input() hora = '13:30';
@Input() disableNuevaCuenta = false; 
  // Valor inicial seleccionado (opcional)
  @Input() set selected(value: TipoRequerimiento | null) {
    if (value) this.form.patchValue({ tipo: value }, { emitEvent: false });
  }

  @Output() cerrar = new EventEmitter<void>();
  @Output() cambio = new EventEmitter<TipoRequerimiento>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tipo: [null as TipoRequerimiento | null, Validators.required],
    });

    this.form.get('tipo')!.valueChanges.subscribe(v => {
      if (v) this.cambio.emit(v as TipoRequerimiento);
    });
  }
}
