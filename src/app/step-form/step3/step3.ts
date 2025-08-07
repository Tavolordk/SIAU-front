// src/app/step-form/step3/step3.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { ReactiveFormsModule, FormGroup }        from '@angular/forms';

@Component({
  selector: 'app-step3',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './step3.html',
  styleUrls:   ['./step3.scss']
})
export class Step3Component {
  /** FormGroup compartido con el padre */
  @Input() form!: FormGroup;

  /** Paso actual y total para la barra de progreso */
  @Input() currentStep!: number;
  @Input() maxSteps!:   number;

  /** Eventos de navegación y subida */
  @Output() prev   = new EventEmitter<number>();
  @Output() next   = new EventEmitter<number>();
  @Output() upload = new EventEmitter<void>();
}
