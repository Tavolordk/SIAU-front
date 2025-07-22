// src/app/shared/main-layout/main-layout.ts
import { Component }      from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterOutlet }   from '@angular/router';
import { NavMenuComponent } from '../nav-menu/nav-menu';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavMenuComponent
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent {}
