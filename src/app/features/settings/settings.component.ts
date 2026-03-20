import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExportImportService } from '../../core/services/export-import.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatSnackBarModule, MatProgressBarModule,
  ],
  template: `
    <div class="page-intro">
      <h1>Settings</h1>
      <p>Import, export and manage your data</p>
    </div>

    @if (loading) {
      <mat-progress-bar mode="indeterminate" class="progress"></mat-progress-bar>
    }

    <div class="settings-grid">
      <mat-card class="action-card">
        <div class="card-icon-wrap blue">
          <mat-icon>download</mat-icon>
        </div>
        <h3>Export Data</h3>
        <p>Export all your data for backup or analysis.</p>
        <div class="card-actions">
          <button mat-raised-button color="primary" (click)="exportJSON()" [disabled]="loading">
            <mat-icon>code</mat-icon> JSON
          </button>
          <button mat-stroked-button color="primary" (click)="exportExcel()" [disabled]="loading">
            <mat-icon>table_chart</mat-icon> Excel
          </button>
        </div>
      </mat-card>

      <mat-card class="action-card">
        <div class="card-icon-wrap green">
          <mat-icon>upload</mat-icon>
        </div>
        <h3>Import Data</h3>
        <p>Import from a previously exported file.</p>
        <div class="card-actions">
          <button mat-raised-button color="primary" (click)="jsonInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> JSON
          </button>
          <input #jsonInput type="file" accept=".json" hidden (change)="importJSON($event)" />
          <button mat-stroked-button color="primary" (click)="excelInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Excel
          </button>
          <input #excelInput type="file" accept=".xlsx,.xls" hidden (change)="importExcel($event)" />
        </div>
      </mat-card>

      <mat-card class="action-card">
        <div class="card-icon-wrap orange">
          <mat-icon>storage</mat-icon>
        </div>
        <h3>Seed from Excel</h3>
        <p>Import your original Excel files to seed the database.</p>
        <div class="card-actions">
          <button mat-raised-button color="warn" (click)="paymentsInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Career Payments
          </button>
          <input #paymentsInput type="file" accept=".xlsx,.xls" hidden (change)="seedPayments($event)" />
          <button mat-stroked-button color="warn" (click)="salariesInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Salaries
          </button>
          <input #salariesInput type="file" accept=".xlsx,.xls" hidden (change)="seedSalaries($event)" />
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-intro {
      margin-bottom: 24px;
    }
    .page-intro h1 {
      font-size: 26px; font-weight: 700; margin: 0 0 2px;
      color: var(--text-primary); letter-spacing: -0.3px;
    }
    .page-intro p { font-size: 14px; color: var(--text-muted); margin: 0; }

    .progress { margin-bottom: 16px; border-radius: 8px; }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .action-card {
      padding: 28px !important;
      display: flex; flex-direction: column; gap: 8px;
    }
    .card-icon-wrap {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .card-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; color: #fff; }
    .card-icon-wrap.blue { background: linear-gradient(135deg, #4361ee, #3651d4); }
    .card-icon-wrap.green { background: linear-gradient(135deg, #0ead69, #059652); }
    .card-icon-wrap.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .action-card h3 {
      margin: 0; font-size: 17px; font-weight: 700;
      color: var(--text-primary);
    }
    .action-card p {
      margin: 0 0 8px; font-size: 14px;
      color: var(--text-secondary); line-height: 1.5;
    }
    .card-actions {
      display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto;
    }
  `],
})
export class SettingsComponent {
  private exportImportService = inject(ExportImportService);
  private snackBar = inject(MatSnackBar);
  loading = false;

  async exportJSON() {
    this.loading = true;
    try {
      await this.exportImportService.exportToJSON();
      this.snackBar.open('JSON exported!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Export failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
  }

  async exportExcel() {
    this.loading = true;
    try {
      await this.exportImportService.exportToExcel();
      this.snackBar.open('Excel exported!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Export failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
  }

  async importJSON(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.loading = true;
    try {
      await this.exportImportService.importFromJSON(file);
      this.snackBar.open('JSON imported successfully!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Import failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
    (event.target as HTMLInputElement).value = '';
  }

  async importExcel(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.loading = true;
    try {
      await this.exportImportService.importFromExcel(file);
      this.snackBar.open('Excel imported successfully!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Import failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
    (event.target as HTMLInputElement).value = '';
  }

  async seedPayments(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!confirm('This will import all payments from the Excel file. Continue?')) return;
    this.loading = true;
    try {
      await this.exportImportService.seedFromCareerPaymentsExcel(file);
      this.snackBar.open('Career payments seeded!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Seed failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
    (event.target as HTMLInputElement).value = '';
  }

  async seedSalaries(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!confirm('This will import all salary data from the Excel file. Continue?')) return;
    this.loading = true;
    try {
      await this.exportImportService.seedFromSalariesExcel(file);
      this.snackBar.open('Salary data seeded!', 'OK', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open('Seed failed: ' + e.message, 'OK', { duration: 5000 });
    }
    this.loading = false;
    (event.target as HTMLInputElement).value = '';
  }
}
