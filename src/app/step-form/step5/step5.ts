// src/app/step-form/step5/step5.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { FontAwesomeModule }                     from '@fortawesome/angular-fontawesome';
import { faEnvelope }                            from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane }                       from '@fortawesome/free-brands-svg-icons';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step5',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule   // importa el módulo para <fa-icon>
  ],
  templateUrl: './step5.html',
  styleUrls:   ['./step5.scss']
})
export class Step5Component {
  @Input() currentStep!: number;
  @Input() maxSteps!:   number;
  @Input() form!:FormGroup

  @Output() validate = new EventEmitter<'email' | 'telegram'>();
  @Output() prev     = new EventEmitter<number>();
  @Output() next     = new EventEmitter<number>();

  // ❗ Aquí expones los iconos al template
  public faEnvelope       = faEnvelope;
  public faTelegramPlane  = faTelegramPlane;
}
