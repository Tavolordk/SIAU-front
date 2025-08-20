import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SolicitudesService } from '../../services/solicitudes.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step1.html',
  styleUrls: ['./step1.scss']
})
export class Step1Component implements OnInit {
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  @Input() form!: FormGroup;
  @Input() tipos: string[] = ['FEDERAL', 'ESTATAL', 'MUNICIPAL'];
    perfiles: any[] = [];
  filteredPerfiles$!: Observable<any[]>;


  constructor(private fb: FormBuilder, private solicitudesService: SolicitudesService ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipoUsuario: ['', Validators.required],
      esSeguridad: ['', Validators.required],
      curp: ['', Validators.required],
      captcha: ['', Validators.required],
      nombre: ['', Validators.required],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      paisNacimiento: ['', Validators.required],
      entidadNacimiento: ['', Validators.required],
      municipioAlcaldia: ['', Validators.required],
      estadoCivil: [''],
      rfc: ['', Validators.required],
      cuip: [''],
      tipoInstitucion: ['', Validators.required],
      entidad: ['', Validators.required],
      municipioAlcaldia2: ['', Validators.required],
      institucion: ['', Validators.required],
      dependencia: [''],
      corporacion: [''],
      area: [''],
      fechaIngreso: ['', Validators.required],
      cargo: [''],
      funciones: [''],
      numeroEmpleado: ['', Validators.required],
      comisionado: ['', Validators.required],
      tipoInstitucion2: ['', Validators.required],
      entidad2: ['', Validators.required],
      municipioAlcaldia3: ['', Validators.required],
      institucion2: ['', Validators.required],
      dependencia2: [''],
      corporacion2: [''],
      aceptaTerminos: [false, Validators.requiredTrue],
    });
  }
  
}