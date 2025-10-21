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
  @Input() email = 'juan.perez@correo.com';
  @Input() city  = 'Ciudad de México';

  @Output() logout = new EventEmitter<void>();
  doLogout() { this.logout.emit(); }
}
