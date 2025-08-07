// src/app/step-form/step4/step4.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { ReactiveFormsModule, FormGroup }        from '@angular/forms';

@Component({
  selector: 'app-step4',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './step4.html',
  styleUrls:   ['./step4.scss']
})
export class Step4Component {
  /** Formulario reactivo compartido */
  @Input() form!: FormGroup;

  /** Progreso */
  @Input() currentStep!: number;
  @Input() maxSteps!:   number;

  /** Eventos de navegación */
  @Output() prev = new EventEmitter<number>();
  @Output() next = new EventEmitter<number>();
}
