import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';

@Component({
  selector: 'app-password-success',
  standalone: true,
  imports: [CommonModule, HeaderSiauComponent],
  templateUrl: './password-success.html',
  styleUrls: ['./password-success.scss']
})
export class PasswordSuccessComponent {
  // Header reutilizable
  usuarioNombre = 'Juan Pérez';
  usuarioRol    = 'Cuenta: U123456';   // segunda línea del header
}
