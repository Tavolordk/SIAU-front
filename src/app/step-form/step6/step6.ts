import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-step6',
  templateUrl: './step6.html',
  styleUrls: ['./step6.scss']
})
export class Step6Component {
  @Input() folio!: string;
}