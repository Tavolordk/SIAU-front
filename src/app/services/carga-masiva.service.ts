// File: src/app/usuarios/services/carga-masiva.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BulkUploadResult } from '../models/bulk-upload-result.model';

@Injectable({ providedIn: 'root' })
export class CargaMasivaService {
  private baseUrl = '/api/usuarios/bulk';

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo y reporta progreso
   */
  uploadFile(file: File): Observable<HttpEvent<any>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post(this.baseUrl, form, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Obtiene resultados del job
   */
  getResults(jobId: string): Observable<BulkUploadResult[]> {
    return this.http.get<BulkUploadResult[]>(`${this.baseUrl}/${jobId}/results`);
  }
}
