import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { StepFormStateService } from '../state/step-form-state.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { FinalizarRegistroDto } from '../../models/solicitudes-step-form.models';
import { mapPerfilesToTexts, buildDocsMetadata } from '../../models/solicitudes.utils';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step4',
  templateUrl: './step4.html',
    standalone: true,                          // 👈
  imports: [CommonModule, ReactiveFormsModule], 
  styleUrls: ['./step4.scss']
})
export class Step4Component implements OnInit {

  // ===== props que usa tu HTML =====
  @Input() currentStep!: number;
  @Input() maxSteps!: number;
  @Output() prev = new EventEmitter<number>();
  @Output() next = new EventEmitter<number>();

  @Input() form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private state: StepFormStateService,
    private api: SolicitudesService
  ) {}

  ngOnInit(): void {
    const s1 = this.state.step1 ?? {};
    const s4 = this.state.step4 ?? {};

    this.form = this.fb.group({
      // nombres EXACTOS de tu HTML
      correo:           [s4.correoContacto ?? s1.correo ?? '', [Validators.required, Validators.email]],
      confirmaCorreo:   [s4.correoContacto ?? s1.correo ?? '', [Validators.required, Validators.email]],
      celular:          [s4.celularContacto ?? '',            [Validators.required, Validators.pattern(/^\d{10}$/)]],
      confirmaCelular:  [s4.celularContacto ?? '',            [Validators.required, Validators.pattern(/^\d{10}$/)]],
      oficina:          [s4.telOficinaContacto ?? ''],
      extension:        [s4.extensionOficina ?? '',           [Validators.pattern(/^\d{1,10}$/)]],
      usaTelegram:      [(s4.medioValidacion ?? '').toUpperCase() === 'TELEGRAM']
    }, {
      validators: [
        equalsValidator('correo', 'confirmaCorreo'),
        equalsValidator('celular', 'confirmaCelular')
      ]
    });
  }

  get f(): { [k: string]: AbstractControl } { return this.form.controls; }

  async onGuardar(): Promise<void> {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Corrige los campos marcados antes de continuar.';
      return;
    }

    this.loading = true;
    try {
      const v = this.form.value;

      // 1) Persistir estado Step4 (los nombres internos del service)
      this.state.step4 = {
        correoContacto: (v.correo || '').trim() || null,
        celularContacto: (v.celular || '').trim() || null,
        telOficinaContacto: (v.oficina || '').trim() || null,
        extensionOficina: (v.extension || '').trim() || null,
        medioValidacion: v.usaTelegram ? 'TELEGRAM' : 'EMAIL'
      };

      // 2) Perfiles -> Text8..Text63
      const perfiles = this.state.step3?.perfiles ?? [];
      const { ConsultaTextos, ModulosOperacion } = mapPerfilesToTexts(perfiles);

      // 3) Documentos -> metadata (si existen)
      const files = this.state.step3?.docs ?? [];
      const Documentos = files.length ? await buildDocsMetadata(files) : [];

      // 4) Payload final para el SP
      const p: FinalizarRegistroDto = {
        RFC: this.state.step1?.rfc ?? null,
        Nombre: this.state.step1?.nombre ?? null,
        Nombre2: this.state.step1?.nombre2 ?? null,
        ApellidoPaterno: this.state.step1?.apellidoPaterno ?? null,
        ApellidoMaterno: this.state.step1?.apellidoMaterno ?? null,
        CURP: this.state.step1?.curp ?? null,
        CUIP: this.state.step1?.cuip ?? null,
        Telefono: this.state.step1?.telefono ?? null,
        CorreoElectronico: this.state.step1?.correo ?? null,
        PaisId: 143,
        Cargo: this.state.step2?.cargo ?? null,
        Funciones: this.state.step2?.funciones ?? null,
        Funciones2: this.state.step2?.funciones2 ?? null,
        TipoUsuario: this.state.step1?.tipoUsuario ?? 0,
        Entidad: this.state.step2?.entidad ?? 0,
        Municipio: this.state.step2?.municipio ?? 0,
        Area: this.state.step2?.area ?? 0,
        Entidad2: this.state.step2?.entidad2 ?? 0,
        Municipio2: this.state.step2?.municipio2 ?? 0,
        Pais2Id: 143,
        Corporacion2: this.state.step2?.corporacion2 ?? 0,
        CheckBox1_NuevaCuenta: true,
        CheckBox2_ModificaPerfiles: !!this.state.step2?.chkModifica,
        CheckBox3_AmpliaPerfiles: !!this.state.step2?.chkAmplia,
        CheckBox4_ReactivaCuenta: !!this.state.step2?.chkReactiva,
        CheckBox5_CambioAdscripcion: !!this.state.step2?.chkCambioAdscripcion,
        CuentaUsuario: this.state.step1?.cuentaUsuario ?? null,
        Password: this.state.step1?.password ?? null,
        NumeroOficio: this.state.step1?.numeroOficio ?? null,
        FolioIn: this.state.step1?.folio ?? null,
        ConsultaTextos,
        ModulosOperacion,

        // Paso 4
        CorreoContacto: this.state.step4?.correoContacto ?? null,
        CelularContacto: this.state.step4?.celularContacto ?? null,
        TelOficinaContacto: this.state.step4?.telOficinaContacto ?? null,
        ExtensionOficina: this.state.step4?.extensionOficina ?? null,

        // Paso 3
        Documentos,

        // Paso 5
        MedioValidacion: this.state.step4?.medioValidacion ?? 'EMAIL'
      };

      // 5) Guardar en backend (SP)
      const res = await firstValueFrom(this.api.guardarStep4(p));

      // 6) Guarda el resultado para mostrar en Step5 y avanza
      this.state.step5 = { ...(this.state.step5 ?? {}), ...res };
      this.successMsg = `¡Guardado! Folio: ${res.folio}`;
      this.next.emit(this.currentStep + 1);
    } catch (err: any) {
      this.errorMsg = err?.error?.message ?? 'No fue posible guardar. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}

/** Validador de igualdad para pares (correo/confirmación, celular/confirmación) */
function equalsValidator(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const va = group.get(a)?.value ?? '';
    const vb = group.get(b)?.value ?? '';
    if (!va || !vb) return null; // el required se valida aparte
    return (String(va).trim() === String(vb).trim()) ? null : { mismatch: { a, b } };
  };
}
