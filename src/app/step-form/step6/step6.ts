import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { ReactiveFormsModule, FormGroup }        from '@angular/forms';

@Component({
  selector: 'app-step6',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './step6.html',
  styleUrls:   ['./step6.scss']
})
export class Step6Component {
  /** Recibe el FormGroup con el control 'codigo' */
  @Input() form!: FormGroup;

  /** Paso actual y total para barra y texto */
  @Input() currentStep!: number;
  @Input() maxSteps!:   number;

  /** Código simulado para mostrar */
  @Input() simulatedCode: string = '';
  @Input() folio:string='';

  /** Navegación y acciones */
  @Output() prev   = new EventEmitter<number>();
  @Output() resend = new EventEmitter<void>();
  @Output() verify = new EventEmitter<void>();

  onVerify() {
    this.verify.emit();
  }
}
