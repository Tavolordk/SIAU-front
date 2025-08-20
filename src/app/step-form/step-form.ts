import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Step1Component } from './step1/step1';
import { Step2Component } from './step2/step2';
import { Step3Component } from './step3/step3';
import { Step4Component } from './step4/step4';
import { Step5Component } from './step5/step5';
import { Step6Component } from './step6/step6';
import { CommonModule } from '@angular/common';
import { StepFormModel } from '../services/personas.service';
import { PersonasService } from '../services/personas.service';
import { CatPerfilDto } from '../services/catalogos.service';
@Component({
  selector: 'app-step-form',
  templateUrl: './step-form.html',
  styleUrls: ['./step-form.scss'],
  standalone:true,
  imports:[Step1Component, Step2Component, Step3Component,Step4Component, Step5Component,Step6Component, CommonModule, ReactiveFormsModule]
})
export class StepFormComponent implements OnInit {
    private personas = inject(PersonasService);

  // Supón que ya tienes armado el modelo consolidado de los pasos:
  model!: StepFormModel;
  form!: FormGroup;
  currentStep = 1;
  maxSteps = 6;
  tipos = ['FEDERAL', 'ESTATAL', 'MUNICIPAL'];
  perfiles: CatPerfilDto[] = [];       // 👈 catálogo completo
  documentos = [
    { label: 'Comprobante de Identificación' },
    { label: 'Comprobante de Domicilio' },
    { label: 'Comprobante Laboral' }
  ];
  uploadedDocs: any[] = [];
  folio = 'RNPSP 2025-05-783456';

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      tipoUsuario: ['', Validators.required],
      esSeguridad: ['', Validators.required],
      perfil: [''],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', Validators.required],
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
}
