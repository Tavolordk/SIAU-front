import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step5',
  templateUrl: './step5.html',
  styleUrls: ['./step5.scss'],
    standalone:true,
  imports:[ReactiveFormsModule]
})
export class Step5Component {
  @Input() form!: FormGroup;
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Output() validate = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
}