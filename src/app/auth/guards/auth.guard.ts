import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { isTokenExpired } from '../jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const profileRaw = localStorage.getItem('profile');
    if (!profileRaw) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    try {
      const profile = JSON.parse(profileRaw);
      const token: string | null = profile?.token ?? profile?.jwt ?? profile?.access_token ?? null;
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('profile');
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
      return true;
    } catch {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
