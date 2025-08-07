// src/app/step-form/step2/step2.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { ReactiveFormsModule, FormGroup }      from '@angular/forms';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [
    CommonModule,        // para *ngFor, *ngIf, etc.
    ReactiveFormsModule  // para [formGroup], formControlName…
  ],
  templateUrl: './step2.html',
  styleUrls:   ['./step2.scss']
})
export class Step2Component {
  @Input() form!: FormGroup;
  @Input() currentStep!: number;
  @Input() maxSteps!:   number;
  @Input() perfiles: string[] = [];

  @Output() addPerfil    = new EventEmitter<void>();
  @Output() removePerfil = new EventEmitter<number>();
  @Output() next         = new EventEmitter<void>();
  @Output() prev         = new EventEmitter<void>();
}
