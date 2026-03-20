import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-branding">
          <div class="brand-logo">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <h1>Career Payments</h1>
          <p>Track your freelance income, manage employees, and monitor your financial journey — all in one place.</p>
        </div>
      </div>
      <div class="auth-right">
        <mat-card class="auth-card">
          <div class="card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>
          <mat-card-content>
            @if (error) {
              <div class="error-message">
                <mat-icon>error_outline</mat-icon>
                {{ error }}
              </div>
            }
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" />
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" [type]="hidePass ? 'password' : 'text'" />
                <button mat-icon-button matSuffix (click)="hidePass = !hidePass" type="button">
                  <mat-icon>{{ hidePass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Sign In
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      min-height: 100vh;
    }
    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #1a1d2e 0%, #232740 50%, #2d3258 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }
    .auth-branding {
      max-width: 400px;
      color: #fff;
    }
    .brand-logo {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
    }
    .brand-logo mat-icon {
      color: #fff; font-size: 28px; width: 28px; height: 28px;
    }
    .auth-branding h1 {
      font-size: 32px; font-weight: 700; margin: 0 0 12px;
      letter-spacing: -0.5px;
    }
    .auth-branding p {
      font-size: 16px; color: rgba(255,255,255,0.6);
      line-height: 1.6;
    }
    .auth-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background: var(--surface);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 8px 8px 0;
      border: 1px solid var(--border) !important;
      box-shadow: var(--shadow-lg) !important;
    }
    .card-header {
      padding: 0 16px;
      margin-bottom: 8px;
    }
    .card-header h2 {
      font-size: 24px; font-weight: 700; margin: 0 0 4px;
      color: var(--text-primary); letter-spacing: -0.3px;
    }
    .card-header p {
      font-size: 14px; color: var(--text-muted); margin: 0;
    }
    .full-width { width: 100%; }
    .submit-btn {
      width: 100%;
      height: 48px;
      font-size: 15px !important;
      font-weight: 600 !important;
      border-radius: 10px !important;
      margin-top: 8px;
    }
    .error-message {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 14px;
      border: 1px solid #fee2e2;
    }
    .error-message mat-icon {
      font-size: 20px; width: 20px; height: 20px; flex-shrink: 0;
    }
    mat-spinner {
      display: inline-block;
    }
    @media (max-width: 768px) {
      .auth-container { flex-direction: column; }
      .auth-left { display: none; }
      .auth-right { padding: 24px; }
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  hidePass = true;
  loading = false;
  error = '';

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      this.error = (e as Error).message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
