import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrashAlt, faArrowLeft, faArrowRight, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from "../../shared/header-siau/header-siau";
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

@Component({
  selector: 'app-registro-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step2.html',
  styleUrls: ['./registro-step2.scss']
})
export class RegistroStep2Component {
  // Paso/progreso
  totalSteps = 6;
  currentStep = 2;
usuarioNombre:string= "Luis Vargas";
usuarioRol:string= "Capturista";
  get progressPercent() {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  // Icons
  icPlus = faPlus;
  icTrash = faTrashAlt;
  icLeft = faArrowLeft;
  icRight = faArrowRight;
  icUser = faUserCircle;

  // Datos
  form: FormGroup;
  perfiles: string[] = ['3101', '3102'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      perfil: ['3101 SUPERVISOR IPH']
    });
  }

  addPerfil() {
    const raw = (this.form.value.perfil ?? '').toString().trim();
    if (!raw) return;
    // Si viene "3101 SUPERVISOR IPH" me quedo con el código (primer token)
    const code = raw.split(/\s+/)[0];
    if (!this.perfiles.includes(code)) this.perfiles.push(code);
    this.form.patchValue({ perfil: '' });
  }

  removePerfil(idx: number) {
    this.perfiles.splice(idx, 1);
  }

  onBack() {
    // TODO: navegación a step1
    console.log('Regresar a Step 1');
  }

  onNext() {
    // TODO: navegación a step3
    console.log('Perfiles seleccionados:', this.perfiles);
  }
}
