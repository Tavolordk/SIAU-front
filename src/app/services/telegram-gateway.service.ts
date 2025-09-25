import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environmentTelegram } from '../environments/environment.telegram';

export interface TelegramSendRes {
  sent: boolean;
  to: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class TelegramGatewayService {

  private http = inject(HttpClient);
  private base = environmentTelegram.apiBaseUrl ?? ''; 

  sendCode$(to: string, code: string, prefix = 'Código:') {
    const url = `${this.base}/api/telegram/send-code`;
    return this.http.post<TelegramSendRes>(url, { to, code, prefix });
  }
  
}
