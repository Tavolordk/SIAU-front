import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step4',
  templateUrl: './step4.html',
  styleUrls: ['./step4.scss'],
    standalone:true,
  imports:[ReactiveFormsModule]
})
export class Step4Component {
  @Input() form!: FormGroup;
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
}