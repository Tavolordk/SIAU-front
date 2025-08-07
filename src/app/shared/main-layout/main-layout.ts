// src/app/shared/main-layout/main-layout.component.ts
import { Component, OnInit }           from '@angular/core';
import { CommonModule }                from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NavMenuComponent } from '../nav-menu/nav-menu';
import { FooterComponent } from '../../footer/footer';
import { filter }                      from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent, FooterComponent],   // ← asegúrate de incluir RouterModule
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit {
  /** Si mostrar el nav-menu */
  showNav = true;
  /** Si ocultar todo el header */
  hideNavbarClass = false;
    isStepformRoute = false;


  /** Rutas que deben ocultar el navbar */
  private hideRoutes = [
    '/login',
    '/primer-inicio',
    '/olvido-contrasena',
    '/restablecer-contrasena',
    '/cambiar-contrasena'
  ];

  constructor(private router: Router) {
    console.log('MainLayoutComponent constructor');
        this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.isStepformRoute = this.router.url.startsWith('/stepform');
      });
  }

  ngOnInit(): void {
    // Comprobación inicial usando router.url
    this.updateNavVisibility(this.router.url);

    // Suscribirse a NavigationEnd para detectar cambios de URL
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('[MainLayout] NavigationEnd:', event.urlAfterRedirects);
        this.updateNavVisibility(event.urlAfterRedirects);
      });
  }

  /** Actualiza showNav y hideNavbarClass según la URL */
  private updateNavVisibility(url: string) {
    const lowerUrl = url.toLowerCase();
    const hide = this.hideRoutes.some(path => lowerUrl.includes(path));
    this.hideNavbarClass = hide;
    this.showNav = !hide;
    console.log('[MainLayout] url=', url, 'hideNavbar=', hide);
  }
}
