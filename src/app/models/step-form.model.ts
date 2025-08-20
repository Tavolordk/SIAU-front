export interface StepFormModel {
  extOficina(personaId: number, telOficina: (personaId: number, telOficina: any, arg2: string, extOficina: any, arg4: boolean) => unknown, arg2: string, extOficina: any, arg4: boolean): unknown;
  telOficina(personaId: number, telOficina: any, arg2: string, extOficina: any, arg4: boolean): unknown;
  // === Datos personales (Step1/Step2) ===
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  rfc?: string;
  curp?: string;
  sexo?: string;
  fechaNacimiento?: string;   // formato YYYY-MM-DD

  // === Contactos (Step3/Step4) ===
  email: string;
  celular?: string;
  telefonoOficina?: string;
  extension?: string;

  // === Asignación (Step5/Step6) ===
  tipoAsignacion?: string;
  estructuraId?: number;
  fechaInicio?: string;        // formato YYYY-MM-DD

  // === Otros flags internos ===
  idPersona?: number;    
  telfOficina:number;
}
