// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter }    from '@angular/router';
import { provideHttpClient } from '@angular/common/http';  // ←
import {environment} from '../app/environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
        { provide: 'API_BASE_URL', useValue: environment.apiBaseUrl }                                
  ]
};
