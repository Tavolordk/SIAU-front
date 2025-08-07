import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step3',
  templateUrl: './step3.html',
  styleUrls: ['./step3.scss'],
  standalone:true,
  imports:[ReactiveFormsModule, CommonModule]
})
export class Step3Component {
  @Input() form!: FormGroup;
  @Input() documentos: { label: string }[] = [];
  @Input() uploadedDocs: any[] = [];
  @Output() fileChange = new EventEmitter<{ event: any; idx: number }>();
  @Output() removeUpload = new EventEmitter<any>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
}