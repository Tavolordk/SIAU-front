import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CAPTCHA_API_BASE_URL } from '../token';
import { Observable, tap } from 'rxjs';

export type CaptchaNewDto = { id: string; imageBase64: string; ttlSeconds: number };
export type CaptchaVerifyDto = { ok: boolean; token?: string };

@Injectable({ providedIn: 'root' })
export class CaptchaApi {
  private http = inject(HttpClient);
  private base = inject(CAPTCHA_API_BASE_URL);
  private tokenKey = 'captcha_token';

  new$(): Observable<CaptchaNewDto> {
    return this.http.get<CaptchaNewDto>(`${this.base}/api/captcha`);
  }

  verify(id?: string, answer?: string): Observable<CaptchaVerifyDto> {
    return this.http.post<CaptchaVerifyDto>(`${this.base}/api/captcha/verify`, { id, answer })
      .pipe(tap(r => { if (r.ok && r.token) localStorage.setItem(this.tokenKey, r.token); }));
  }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  clearToken(): void { localStorage.removeItem(this.tokenKey); }
}
