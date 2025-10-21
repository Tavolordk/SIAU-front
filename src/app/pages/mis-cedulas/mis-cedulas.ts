import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';

@Component({
  selector: 'app-mis-cedulas',
  standalone: true,
  imports: [CommonModule, HeaderSiauComponent],
  templateUrl: './mis-cedulas.html',
  styleUrls: ['./mis-cedulas.scss']
})
export class MisCedulasComponent {
  // Datos para el header reutilizable
  usuarioNombre = 'Juan Pérez';
  usuarioCuenta = 'Cuenta: U123456';

  // Estado del acordeón del menú
  cedulasOpen = true;
  toggleCedulas() { this.cedulasOpen = !this.cedulasOpen; }
}
