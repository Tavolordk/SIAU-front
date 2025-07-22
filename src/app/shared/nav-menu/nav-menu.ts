// src/app/shared/nav-menu/nav-menu.ts
import { Component }      from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule }   from '@angular/router';  // ←

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule                                // ← para routerLink
  ],
  templateUrl: './nav-menu.html',
  styleUrls: ['./nav-menu.scss']                // ← notar plural
})
export class NavMenuComponent {
  isCollapsed = true;
}
