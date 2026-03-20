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
    <h1>Settings</h1>

    @if (loading) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <div class="settings-grid">
      <mat-card>
        <mat-card-header><mat-card-title>Export Data</mat-card-title></mat-card-header>
        <mat-card-content>
          <p>Export all your data for backup or analysis.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="exportJSON()" [disabled]="loading">
            <mat-icon>code</mat-icon> Export JSON
          </button>
          <button mat-raised-button color="accent" (click)="exportExcel()" [disabled]="loading">
            <mat-icon>table_chart</mat-icon> Export Excel
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Import Data</mat-card-title></mat-card-header>
        <mat-card-content>
          <p>Import data from a previously exported JSON or Excel file.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="jsonInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Import JSON
          </button>
          <input #jsonInput type="file" accept=".json" hidden (change)="importJSON($event)" />
          <button mat-raised-button color="accent" (click)="excelInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Import Excel
          </button>
          <input #excelInput type="file" accept=".xlsx,.xls" hidden (change)="importExcel($event)" />
        </mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Seed from Excel Files</mat-card-title></mat-card-header>
        <mat-card-content>
          <p>Import your original "My Career Payments" and "BeLightTech Salaries" Excel files to seed the database.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="warn" (click)="paymentsInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Seed Career Payments (.xlsx)
          </button>
          <input #paymentsInput type="file" accept=".xlsx,.xls" hidden (change)="seedPayments($event)" />
          <button mat-raised-button color="warn" (click)="salariesInput.click()" [disabled]="loading">
            <mat-icon>upload_file</mat-icon> Seed Salaries (.xlsx)
          </button>
          <input #salariesInput type="file" accept=".xlsx,.xls" hidden (change)="seedSalaries($event)" />
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-top: 16px; }
    mat-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
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
