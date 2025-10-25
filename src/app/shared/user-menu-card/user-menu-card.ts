import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-menu-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu-card.html',
  styleUrls: ['./user-menu-card.scss']
})
export class UserMenuCardComponent {
  @Input() email = 'octavio.olea@sspc.gob.mx';
  @Input() city  = 'Ciudad de México';

  @Output() logout = new EventEmitter<void>();
  doLogout() { this.logout.emit(); }
}
