import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { API_BASE_URL, USER_API_BASE_URL, REQUEST_API_BASE_URL, CATALOG_API_BASE_URL, CAPTCHA_API_BASE_URL } from '../app/core/token';
import { environment } from '../app/environments/environment';
import { environmentUser } from '../app/environments/environment.user';
import { environmentRequest } from './environments/environment.request';
import { environmentCatalog } from './environments/environments.catalogos';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { captchaInterceptor } from './core/captcha/captcha.interceptor';
import { environmentCaptcha } from './environments/environment.captcha';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        captchaInterceptor,   // <- añade aquí
      ])
    ),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: USER_API_BASE_URL, useValue: environmentUser.apiBaseUrl },
    { provide: REQUEST_API_BASE_URL, useValue: environmentRequest.apiBaseUrl },
    { provide: CATALOG_API_BASE_URL, useValue: environmentCatalog.apiBaseUrl },
    { provide: CAPTCHA_API_BASE_URL, useValue: environmentCaptcha.apiBaseUrl },

  ]
};
