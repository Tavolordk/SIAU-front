import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegistroStep1V2Component } from '../pages/registro-step1-v2/registro-step1-v2';
import { RegistroStep2Component } from '../pages/registro-step2-v2/registro-step2';
import { RegistroStep3Component } from '../pages/registro-step3/registro-step3';
import { RegistroStep4Component } from '../pages/registro-step4/registro-step4';
import { RegistroStep5Component } from '../pages/registro-step5/registro-step5';
import { RegistroStep6Component } from '../pages/registro-step6/registro-step6';
import { RegistroStep7Component } from '../pages/registro-step7/registro-step7';
import { RegistroConfirmacionComponent } from '../pages/registro-confirmacion/registro-confirmacion';
import { CommonModule } from '@angular/common';
import { StepFormModel } from '../services/personas.service';
import { PersonasService } from '../services/personas.service';
import { CatPerfilDto } from '../services/catalogos.service';
import { emailBasicValidator, phoneMxValidator } from '../shared/validators';
@Component({
  selector: 'app-step-form',
  templateUrl: './step-form.html',
  styleUrls: ['./step-form.scss'],
  standalone: true,
  imports: [RegistroStep1V2Component, RegistroStep2Component, RegistroStep3Component, RegistroStep4Component, RegistroStep5Component, RegistroStep6Component,RegistroStep7Component ,RegistroConfirmacionComponent,CommonModule, ReactiveFormsModule]
})
export class StepFormComponent implements OnInit {
  private personas = inject(PersonasService);

  // Supón que ya tienes armado el modelo consolidado de los pasos:
  model!: StepFormModel;
  form!: FormGroup;
  currentStep = 1;
  maxSteps = 8;
  tipos = [];
  perfiles: CatPerfilDto[] = [];       // 👈 catálogo completo
  documentos = [
    { label: 'Comprobante de Identificación' },
    { label: 'Comprobante de Domicilio' },
    { label: 'Comprobante Laboral' }
  ];
  uploadedDocs: any[] = [];
  folio = 'RNPSP 2025-05-783456';
  currentStepIndex: any;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      tipoUsuario: ['', Validators.required],
      esSeguridad: ['', Validators.required],
      perfil: [''],
      correo: ['', [Validators.required, Validators.email, emailBasicValidator()]],
      celular: ['', [Validators.required, phoneMxValidator()]],
      celularConfirm: [''],
      telefonoOficina: [''],
      extension: [''],
      appTelegram: [false],
      codigo: ['', Validators.required]
    });
  }

  nextStep() { if (this.currentStep < this.maxSteps) this.currentStep++; }
  prevStep() { if (this.currentStep > 1) this.currentStep--; }
  addPerfil() {
    const val = this.form.get('perfil')?.value;
    if (val) this.perfiles.push(val);
    this.form.patchValue({ perfil: '' });
  }
  removePerfil(i: number) { this.perfiles.splice(i, 1); }
  onFileChange(e: any, i: number) {
    const f = e.target.files[0];
    if (f) {
      this.uploadedDocs.push({ id: Date.now(), tipo: this.documentos[i].label, fecha: new Date().toISOString().split('T')[0] });
    }
  }
  removeUpload(row: any) { this.uploadedDocs = this.uploadedDocs.filter(r => r.id !== row.id); }
  onValidateCode() { if (this.form.get('codigo')?.valid) this.nextStep(); }

  guardando = false;

  finalizar() {
    this.guardando = true;
    this.personas.saveFromStepForm(this.model).subscribe({
      next: (personaId) => {
        this.guardando = false;
        // navegar o mostrar éxito
        // this.router.navigate(['/personas', personaId]);
        console.log('Persona guardada:', personaId);
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al guardar', err);
      }
    });
  }
  goNextFromStep1(): void {
  // Aquí ya sabes que Step1 es válido
  this.currentStepIndex++; // o navega al siguiente contenedor/página
}

}
