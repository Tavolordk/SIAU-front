import {
  Component, HostListener, Input, ElementRef, ViewChild, TemplateRef, ViewContainerRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { UserMenuCardComponent } from '../user-menu-card/user-menu-card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header-siau',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, OverlayModule, PortalModule, UserMenuCardComponent],
  templateUrl: './header-siau.html',
  styleUrls: ['./header-siau.scss']
})
export class HeaderSiauComponent {
  @Input() title = 'Sistema Integral de Administración de Usuarios';
  @Input() userName = '';
  @Input() userRole = '';
  @Input() logoSrc = 'assets/images/SSPC.png';
  @Input() logoAlt = 'Seguridad';
  @Input() bgSrc: string | null = 'assets/images/encabezado.png';
  @Input() height = 120;
  @Input() showUser = true;
  @Input() userEmail = 'octavio.olea@sspc.gob.mx';
  @Input() userCity  = 'Ciudad de México';

  icUser = faCircleUser;
  isOpen = false;

logout(): void {
  this.auth.logout();                  // 👈 un solo punto de verdad
}
  @ViewChild('userBtn', { read: ElementRef }) userBtn!: ElementRef<HTMLElement>;
  @ViewChild('menuTpl') menuTpl!: TemplateRef<any>;

  private overlayRef?: OverlayRef;

  constructor(private overlay: Overlay, private vcr: ViewContainerRef, private host: ElementRef<HTMLElement>, private auth: AuthService) {}

  toggleMenu(ev: MouseEvent) {
    ev.stopPropagation();
    if (this.overlayRef?.hasAttached()) { this.closeMenu(); return; }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.userBtn.nativeElement)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
        { originX: 'end', originY: 'top',    overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'user-menu-panel-container'
    });

    this.overlayRef.attach(new TemplatePortal(this.menuTpl, this.vcr));
    this.isOpen = true;

    this.overlayRef.backdropClick().subscribe(() => this.closeMenu());
    this.overlayRef.keydownEvents().subscribe(e => { if ((e as KeyboardEvent).key === 'Escape') this.closeMenu(); });
    this.overlayRef.detachments().subscribe(() => this.isOpen = false);
  }

  closeMenu() {
    this.overlayRef?.detach();
    this.isOpen = false;
  }

  @HostListener('document:click')
  onDocClick() { this.closeMenu(); }

  @HostListener('document:keydown.escape')
  onEsc() { this.closeMenu(); }

  onLogout() { this.closeMenu(); /* tu lógica */ }

  ngOnDestroy() {
    this.overlayRef?.dispose();
  }
}
