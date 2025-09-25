import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CaptchaApi } from './captcha.api';

export const captchaInterceptor: HttpInterceptorFn = (req, next) => {
  const cap = inject(CaptchaApi);
  // Ajusta el patrón de URL de tus endpoints de Solicitudes:
  if (req.url.includes('/api/solicitudes/')) {
    const token = cap.getToken();
    if (token) {
      req = req.clone({ setHeaders: { 'X-Captcha-Token': token } });
    }
  }
  return next(req);
};
