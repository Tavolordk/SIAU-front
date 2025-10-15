import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, of, switchMap, map, Observable } from 'rxjs';
import { PersonaCreateDto } from '../models/persona.model';
import { ContactoCreateDto } from '../models/contacto.model';
@Injectable({ providedIn: 'root' })
export class PersonasService {
  private http = inject(HttpClient);
    private baseUrl = 'http://10.241.136.29:7143/personas';


  // ========== ORQUESTACIÓN PRINCIPAL ==========
saveFromStepForm(model: StepFormModel) {
  const persona = this.mapToPersona(model);

  return this.createPersona(persona).pipe(
    switchMap((res: { id: number }) => {
      const personaId: number = res.id;

      const ops = [
        this.upsertContactoIf(personaId, model.email, 'correo', undefined, true),
        this.upsertContactoIf(personaId, model.celular, 'celular', undefined, true),
        this.upsertContactoIf(personaId, model.telefonoOficina, 'tel_oficina', model.extension, false),
        this.addAsignacionIfPossible(personaId, model),
      ].filter((x): x is Observable<any> => !!x);

      return ops.length ? forkJoin(ops).pipe(map(() => personaId)) : of(personaId);
    })
  );
}


  // ========== PERSONA ==========
  private createPersona(dto: PersonaCreateDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}`, dto);
  }

  // ========== CONTACTO ==========
  private upsertContactoIf(
    personaId: number,
    valor: string | undefined,
    tipo: 'correo' | 'celular' | 'tel_oficina',
    extension?: string,
    esPrincipal: boolean = false
  ): Observable<any> | null {
    if (!valor?.trim()) return null;
    const dto: ContactoCreateDto = { tipo, valor: valor.trim(), esPrincipal };
    if (extension?.trim()) dto.extension = extension.trim();
    return this.addContacto(personaId, dto);
  }

  private addContacto(personaId: number, dto: ContactoCreateDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/${personaId}/contactos`, dto);
  }

  // ========== ASIGNACIÓN ==========
  private addAsignacionIfPossible(personaId: number, model: StepFormModel): Observable<any> | null {
    if (!model.tipoAsignacion || !model.estructuraId || !model.fechaInicio) return null;
    const dto = {
      tipoAsignacion: model.tipoAsignacion,
      estructuraId: model.estructuraId,
      fechaInicio: model.fechaInicio
    };
    return this.http.post(`${this.baseUrl}/${personaId}/asignaciones`, dto);
  }

  // ========== MAPEO ==========
  private mapToPersona(model: StepFormModel): PersonaCreateDto {
    return {
      nombre: model.nombre,
      apellidoPaterno: model.apellidoPaterno,
      apellidoMaterno: model.apellidoMaterno,
      rfc: model.rfc,
      curp: model.curp,
      sexo: model.sexo,
      fechaNacimiento: model.fechaNacimiento
    };
  }
}import { StepFormModel } from '../models/step-form.model';

export type { StepFormModel };

