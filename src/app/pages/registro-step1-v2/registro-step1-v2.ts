import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserCircle, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { HeaderSiauComponent } from "../../shared/header-siau/header-siau";
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

@Component({
  selector: 'app-registro-step1-v2',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step1-v2.html',
  styleUrls: ['./registro-step1-v2.scss']
})
export class RegistroStep1V2Component {
  // Font Awesome icons
  icUser = faUserCircle;
  icLeft = faArrowLeft;
  icRight = faArrowRight;
  icCalendar = faCalendarAlt;

  form: FormGroup;
usuarioNombre: string="Luis Vargas";
usuarioRol: string="Capturista";
currentStep: number=1;
totalSteps: number=6;
  get progressPercent() {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tipoUsuario: [''],
      personalSeguridad: [''],
      curp: ['BADD110313HMLNS09'],
      captchaText: [''],
      nombre: ['RODOLFO'],
      primerApellido: ['CRUZ'],
      segundoApellido: ['RUIZ'],
      sexo: [''],
      fechaNacimiento: ['13/08/2025'],
      nacionalidad: [''],
      paisNacimiento: [''],
      entidadNacimiento: [''],
      municipioNacimiento: [''],
      estadoCivil: [''],
      rfc: [''],
      cuip: [''],
      tipoInstitucion: [''],
      entidad: [''],
      municipio: [''],
      institucion: [''],
      dependencia: [''],
      corporacion: [''],
      area: [''],
      cargo: [''],
      funciones: [''],
      fechaIngreso: [''],
      numEmpleado: [''],
      comisionado: [''],
      paisComision: [''],
      tipoInstitucionComision: [''],
      institucionComision: [''],
      entidadComision: [''],
      municipioComision: [''],
      dependenciaComision: [''],
      corporacionComision: [''],
      especificarComision: [''],
      aceptaTerminos: [false]
    });
  }

  // Ejemplos de handlers (conéctalos a tus servicios cuando toque)
  onVerificarCurp() {
    // TODO: llamar a tu API de verificación de CURP
    console.log('Verificar CURP:', this.form.value.curp);
  }

  onRegresar() {
    // TODO: navegación al paso anterior (si aplica)
    console.log('Regresar');
  }

  onSiguiente() {
    if (this.form.valid) {
      // TODO: navega a Step 2
      console.log('Step1 listo', this.form.value);
    }
  }
}
