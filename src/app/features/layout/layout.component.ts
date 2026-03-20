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
          <mat-icon class="brand-icon">account_balance_wallet</mat-icon>
          <span class="brand-text">Career Payments</span>
        </div>
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              (click)="onNavClick()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">{{ getPageTitle() }}</span>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
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
      width: 250px;
      background: #fafafa;
    }
    .sidenav-header {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .brand-icon {
      color: #1a237e;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .brand-text {
      font-size: 16px;
      font-weight: 600;
      color: #1a237e;
    }
    .active-link {
      background: rgba(26, 35, 126, 0.08) !important;
      color: #1a237e !important;
    }
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .toolbar-title {
      margin-left: 8px;
      font-size: 18px;
    }
    .spacer {
      flex: 1;
    }
    .content {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .user-info {
      opacity: 0.7;
    }
    @media (max-width: 599px) {
      .content {
        padding: 8px;
      }
      .toolbar-title {
        font-size: 15px;
      }
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
