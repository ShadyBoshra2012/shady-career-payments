import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Observable, map, shareReplay } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        [mode]="(isMobile$ | async) ? 'over' : 'side'"
        [opened]="!(isMobile$ | async)"
        class="sidenav"
      >
        <div class="sidenav-header">
          <div class="brand-logo">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="brand-info">
            <span class="brand-text">Career Payments</span>
            <span class="brand-sub">Finance Tracker</span>
          </div>
        </div>
        <mat-nav-list class="nav-list">
          @for (item of navItems; track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              (click)="onNavClick()"
              class="nav-item"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
        <div class="sidenav-footer">
          <small>v1.0 &middot; Shady Boshra</small>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" class="menu-btn">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">{{ getPageTitle() }}</span>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-btn">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info" mat-menu-item disabled>
              <small>{{ (auth.user$ | async)?.email }}</small>
            </div>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              Sign Out
            </button>
          </mat-menu>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 260px;
      background: linear-gradient(180deg, #1a1d2e 0%, #232740 100%);
      border-right: none !important;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      padding: 24px 20px;
      gap: 12px;
    }
    .brand-logo {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-logo mat-icon {
      color: #fff;
      font-size: 22px;
      width: 22px; height: 22px;
    }
    .brand-info { display: flex; flex-direction: column; }
    .brand-text {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.2px;
    }
    .brand-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
    }

    .nav-list {
      padding: 8px 12px !important;
    }
    .nav-item {
      border-radius: 10px !important;
      margin-bottom: 2px !important;
      color: rgba(255,255,255,0.75) !important;
      transition: all 0.2s ease !important;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #fff !important;
    }
    .nav-item:hover mat-icon {
      color: rgba(255,255,255,0.95) !important;
    }
    .nav-item mat-icon {
      color: rgba(255,255,255,0.6) !important;
    }
    .active-link {
      background: rgba(67, 97, 238, 0.2) !important;
      color: #a4b4ff !important;
    }
    .active-link mat-icon {
      color: #a4b4ff !important;
    }

    .sidenav-footer {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 16px 20px;
      color: rgba(255,255,255,0.25);
      font-size: 11px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
      background: rgba(255,255,255,0.85) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      color: var(--text-primary) !important;
      box-shadow: none !important;
    }
    .menu-btn {
      color: var(--text-secondary);
    }
    .toolbar-title {
      margin-left: 8px;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.2px;
    }
    .spacer { flex: 1; }
    .avatar-btn {
      color: var(--text-secondary);
    }

    .content {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .user-info {
      opacity: 0.7;
    }
    @media (max-width: 599px) {
      .content { padding: 12px; }
      .toolbar-title { font-size: 15px; }
    }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  isMobile$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(map((r) => r.matches), shareReplay());

  navItems = [
    { route: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { route: '/payments', icon: 'payments', label: 'Payments' },
    { route: '/gods-money', icon: 'volunteer_activism', label: "God's Money" },
    { route: '/employees', icon: 'people', label: 'Employees' },
    { route: '/salaries', icon: 'paid', label: 'Salaries' },
    { route: '/settings', icon: 'settings', label: 'Settings' },
  ];

  getPageTitle(): string {
    const url = this.router.url;
    const item = this.navItems.find((n) => url.startsWith(n.route));
    return item?.label || 'Career Payments';
  }

  async onNavClick() {
    const isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset);
    if (isMobile) {
      this.sidenav.close();
    }
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
