import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';

@Component({
  selector: 'app-consultar-cedulas',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './consultar-cedulas.html',
  styleUrls: ['./consultar-cedulas.scss']
})
export class ConsultarCedulasComponent {
  // Header
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  icBars = faBars;

  onToggleSidebar(){ console.log('toggle sidebar'); }
  onBuscar(){ console.log('buscar'); }
  onLimpiar(){ console.log('limpiar'); }
  onAprobar(){ console.log('aprobar'); }
}
