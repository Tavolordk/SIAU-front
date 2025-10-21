import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ResultadoCoincidencia {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string; // o Date si prefieres
  curp: string;
  rfc: string;
  cuip: string;
  sexo: string;
  domicilioNacimiento: string;
}

@Component({
  selector: 'app-resultados-coincidencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados-coincidencia.html',
  styleUrls: ['./resultados-coincidencia.scss'],
})
export class ResultadosCoincidenciaComponent {
  @Input() titulo = 'Resultados con coincidencia';
  @Input() resultados: ResultadoCoincidencia[] = [
    {
      nombre: 'Juan',
      primerApellido: 'Perez',
      segundoApellido: 'Perez',
      fechaNacimiento: '01/01/1980',
      curp: 'JUPP800101XXXXXXX',
      rfc: 'JUPP800101XXX',
      cuip: 'JUPP800101XXXXXXXXXX',
      sexo: 'Masculino',
      domicilioNacimiento: 'CDMX - Alvaro Obregón',
    },
    {
      nombre: 'Juan',
      primerApellido: 'Perea',
      segundoApellido: 'Perez',
      fechaNacimiento: '02/01/1980',
      curp: 'JUPP800102XXXXXXX',
      rfc: 'JUPP800102XXX',
      cuip: 'JUPP800102XXXXXXXXXX',
      sexo: 'Masculino',
      domicilioNacimiento: 'Aguascalientes - El llano',
    },
  ];

  @Output() closed = new EventEmitter<void>();
}
