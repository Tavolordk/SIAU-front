import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultar-cedulas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-cedulas-compact.html',
  styleUrls: ['./consulta-cedulas-compact.scss']
})
export class ConsultarCedulasComponent {
  // Handlers opcionales para íconos de acciones
  onSave(rowId: string) {
    console.log('Guardar fila', rowId);
  }

  onComments(rowId: string) {
    console.log('Comentarios fila', rowId);
  }
}
