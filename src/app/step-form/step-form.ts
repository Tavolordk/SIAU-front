import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { RegistroStep1V2Component } from '../pages/registro-step1-v2/registro-step1-v2';
import { RegistroStep2Component }   from '../pages/registro-step2-v2/registro-step2';
import { RegistroStep3Component }   from '../pages/registro-step3/registro-step3';
import { RegistroStep4Component }   from '../pages/registro-step4/registro-step4';
import { RegistroStep5Component }   from '../pages/registro-step5/registro-step5';
import { RegistroStep6Component }   from '../pages/registro-step6/registro-step6';
import { RegistroStep7Component }   from '../pages/registro-step7/registro-step7';
import { RegistroConfirmacionComponent } from '../pages/registro-confirmacion/registro-confirmacion';

import { emailBasicValidator, phoneMxValidator } from '../shared/validators';

import { InsertarCedulaService } from '../services/insertar-cedula.service';
import { InsertarCedulaRequest, PerfilItem, DocumentoItem } from '../models/insertar-cedula-request.model';
import { StepFormStateService } from '../step-form/state/step-form-state.service';

@Component({
  selector: 'app-step-form',
  templateUrl: './step-form.html',
  styleUrls: ['./step-form.scss'],
  standalone: true,
  imports: [
    RegistroStep1V2Component, RegistroStep2Component, RegistroStep3Component,
    RegistroStep4Component, RegistroStep5Component, RegistroStep6Component,
    RegistroStep7Component, RegistroConfirmacionComponent,
    CommonModule, ReactiveFormsModule
  ]
})
export class StepFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private insertar = inject(InsertarCedulaService);
  private state = inject(StepFormStateService);

  form!: FormGroup;
  currentStep = 1;
  maxSteps = 8;

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

  // ========= NUEVO: Step1 -> guardamos en el state =========
  onStep1Proceed(e: { step1: any; step2: any }) {
    this.state.save('step1', e.step1, true);
    this.state.save('step2', e.step2, true);
    this.nextStep();
  }

  // ========= Guardado =========
  guardando = false;

  // Se ejecuta cuando Step6 valida OTP y emite (proceed)
  onOtpVerified() {
    const body = this.buildInsertarBody();

    this.guardando = true;
    this.insertar.insertar(body).subscribe({
      next: (resp) => {
        this.guardando = false;

        if (resp?.success === 1) {
          this.setReceipt(resp.folio || 'N/D');
          this.currentStep = 7;
        } else {
          this.currentStep = 7;
        }
      },
      error: (err) => {
        this.guardando = false;
        alert(err?.message || 'Error de red al guardar la cédula.');
        console.error(err);
      }
    });
  }

  goToConfirm() {
    this.currentStep = 8;
  }

  // ========= Helpers de mapeo =========
  private nowParts() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    };
  }

  private toNull(v: any) {
    return v === undefined || v === null || String(v).trim() === '' ? null : v;
  }

  private buildInsertarBody(): InsertarCedulaRequest {
    const s1 = (this.state.get('step1') ?? {}) as any;
    const s2 = (this.state.get('step2') ?? {}) as any;
    const s3 = (this.state.step3 ?? {}) as any; // { docs: Step3Doc[] }
    const s4 = (this.state.get('step4') ?? {}) as any;

    // ---- Perfiles (ARREGLO tipado) ----
    const perfiles: any[] = Array.isArray(s2?.perfiles) ? s2.perfiles : [];
    const perfilesJson: PerfilItem[] = perfiles.map((p: any) => ({
      id: Number(p?.id ?? p?.perfilId ?? 0),
      nombre: String(p?.nombre ?? p?.clave ?? p?.funcion ?? '')
    }));

    // ---- Documentos (ARREGLO tipado) ----
    const documentosJson: DocumentoItem[] = (s3?.docs || []).map((d: any) => ({
      tipo: String(d?.tipo ?? d?.tipoDocumentoNombre ?? d?.tipoDocumentoId ?? ''),
      nombreArchivo: String(d?.file?.name ?? d?.nombreArchivo ?? '')
    }));

    const { fecha, hora } = this.nowParts();

    // Lee datos de sesión si los tienes
    const cuentaCodigo = localStorage.getItem('cuenta_codigo') || 'U000000';
    const userDisplay  = localStorage.getItem('usuario_nombre') || 'Usuario';

    const body: InsertarCedulaRequest = {
      // 👇 snake_case, como lo pide el backend
      cuenta_codigo: cuentaCodigo,
      usuario_sistema_nombre: userDisplay,
      tipo_usuario: String(s1?.tipoUsuario ?? ''),

      fecha_pantalla: fecha,
      hora_pantalla: hora,

      // Ajusta según tu flujo real: ‘ALTA’, ‘MODIFICACION’, etc.
      tipo_tramite: 'NUEVA CUENTA',
      personal_seguridad: String(s1?.esSeguridad ?? '').toLowerCase() === 'si',

      nombres: s1?.nombre ?? '',
      primer_apellido: s1?.primerApellido ?? '',
      segundo_apellido: s1?.segundoApellido ?? '',
      sexo: String(s1?.sexo ?? ''),
      fecha_nacimiento: s1?.fechaNacimiento ?? fecha,
      nacionalidad: String(s1?.nacionalidad ?? ''),
      pais_nacimiento: String(s1?.paisNacimiento ?? ''),
      entidad_nacimiento: String(s1?.entidadNacimiento ?? ''),
      municipio_alcaldia: String(s1?.municipioAlcaldia ?? ''),
      estado_civil: String(s1?.estadoCivil ?? ''),

      fecha_solicitud: fecha,
      rfc: s1?.rfc ?? '',
      cuip: s1?.cuip ?? '',
      curp: s1?.curp ?? '',

      correo_electronico: s4?.correoContacto ?? '',
      telefono: s4?.celularContacto ?? '',
      tiene_telegram: !!s4?.medioValidacion && String(s4.medioValidacion).toLowerCase() === 'telegram',

      tipo_institucion: String(s1?.tipoInstitucion ?? ''),
      entidad: String(s1?.entidad ?? ''),
      municipio: String(s1?.municipioAlcaldia2 ?? ''),
      institucion: String(s1?.institucion ?? ''),
      dependencia: String(s1?.dependencia ?? ''),
      corporacion: String(s1?.corporacion ?? ''),
      area: String(s1?.area ?? ''),
      cargo: s1?.cargo ?? '',

      funciones: s1?.funciones ?? '',
      fecha_ingreso: s1?.fechaIngreso ?? fecha,
      numero_empleado: String(s1?.numeroEmpleado ?? ''),

      esta_comisionado: String(s1?.comisionado ?? '').toLowerCase() === 'si',
      pais_comision: '',
      tipo_institucion_comision: String(s1?.tipoInstitucion2 ?? ''),
      entidad_comision: String(s1?.entidad2 ?? ''),
      municipio_comision: String(s1?.municipioAlcaldia3 ?? ''),
      institucion_comision: String(s1?.institucion2 ?? ''),
      dependencia_comision: String(s1?.dependencia2 ?? ''),
      corporacion_comision: String(s1?.corporacion2 ?? ''),
      especificar_comision: '',

      sistema: 'SIAU',
      // ✅ arreglos, sin stringify
      perfiles_json: perfilesJson,
      tipo_documento_sel: '',
      documentos_json: documentosJson,

      estado_solicitud: 'Recibida',
      creado_por: Number(localStorage.getItem('usuario_id') || 0),
    };

    return body;
  }

  private setReceipt(folio: string) {
    const s4 = (this.state.get('step4') ?? {}) as any;
    const docsNombres = (this.state.step3?.docs || []).map((d: any) => d?.file?.name || 'Documento');

    const receipt = {
      folio,
      fechaISO: new Date().toISOString(),
      documentos: docsNombres,
      correoUsuario: s4?.correoContacto || '',
      telefonoTelegramUsuario: (s4?.medioValidacion || '').toLowerCase() === 'telegram'
        ? (s4?.celularContacto || null)
        : null
    };

    this.state.save('receipt', receipt, true);
  }
}
