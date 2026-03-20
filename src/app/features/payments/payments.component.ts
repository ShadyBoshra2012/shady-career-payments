import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { DataService } from '../../core/services/data.service';
import { Payment, MainScope, PaymentSplit, PaymentAttachment } from '../../core/models';
import { AttachmentManagerComponent } from '../../shared/components/attachment-manager.component';
import { PaymentDialogComponent } from './payment-dialog.component';

interface ProjectGroup {
  scopeName: string;
  scopeId: string;
  payments: Payment[];
  totalReceived: number;
  totalMine: number;
  totalGod: number;
  count: number;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCardModule, MatChipsModule,
    MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule, MatExpansionModule,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="header-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Search</mat-label>
          <input matInput (input)="applyFilter($event)" placeholder="Filter payments..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Add Payment
        </button>
      </div>

      <div class="summary-row">
        <mat-card class="mini-stat">
          <strong>{{ totalCount }}</strong> records |
          Received: <strong>{{ totalReceived | number:'1.0-0' }} EGP</strong> |
          Mine: <strong>{{ totalMine | number:'1.0-0' }} EGP</strong> |
          God: <strong>{{ totalGod | number:'1.0-0' }} EGP</strong>
        </mat-card>
      </div>

      <mat-accordion multi>
        @for (group of projectGroups; track group.scopeId) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ group.scopeName }}
                <span class="badge">{{ group.count }}</span>
              </mat-panel-title>
              <mat-panel-description>
                Received: {{ group.totalReceived | number:'1.0-0' }} EGP |
                Mine: {{ group.totalMine | number:'1.0-0' }} EGP |
                God: {{ group.totalGod | number:'1.0-0' }} EGP
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="table-container">
              <table mat-table [dataSource]="group.payments">
                <ng-container matColumnDef="subScope">
                  <th mat-header-cell *matHeaderCellDef>Sub Scope</th>
                  <td mat-cell *matCellDef="let p">{{ p.subScope }}</td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let p">{{ p.date | date:'MMM yyyy' }}</td>
                </ng-container>
                <ng-container matColumnDef="receivedEGP">
                  <th mat-header-cell *matHeaderCellDef>Received (EGP)</th>
                  <td mat-cell *matCellDef="let p">{{ p.receivedEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="mineEGP">
                  <th mat-header-cell *matHeaderCellDef>Mine (EGP)</th>
                  <td mat-cell *matCellDef="let p">{{ p.mineEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godAmount">
                  <th mat-header-cell *matHeaderCellDef>God</th>
                  <td mat-cell *matCellDef="let p">{{ p.godAmount | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godPercentage">
                  <th mat-header-cell *matHeaderCellDef>God %</th>
                  <td mat-cell *matCellDef="let p">{{ p.godPercentage | number:'1.1-1' }}%</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-icon-button color="primary" (click)="openDialog(p)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deletePayment(p)" matTooltip="Delete">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 48px; }
    .header-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
    .filter-field { flex: 1; min-width: 180px; }
    .summary-row { margin-bottom: 16px; }
    .mini-stat { padding: 12px 16px; font-size: 14px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    th, td { white-space: nowrap; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #1565c0; color: #fff; border-radius: 12px;
      font-size: 12px; min-width: 22px; height: 22px; padding: 0 6px; margin-left: 8px;
    }
    mat-expansion-panel { margin-bottom: 4px; }
    ::ng-deep .mat-expansion-panel-header-description {
      justify-content: flex-end;
      font-size: 13px;
    }
    @media (max-width: 599px) {
      .header-row { flex-direction: column; }
      .filter-field { min-width: 100%; }
      ::ng-deep .mat-expansion-panel-header-description { display: none !important; }
    }
  `],
})
export class PaymentsComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = true;
  payments: Payment[] = [];
  mainScopes: MainScope[] = [];
  projectGroups: ProjectGroup[] = [];

  displayedColumns = ['subScope', 'date', 'receivedEGP', 'mineEGP', 'godAmount', 'godPercentage', 'actions'];
  filterText = '';

  totalReceived = 0;
  totalMine = 0;
  totalGod = 0;
  totalCount = 0;

  ngOnInit() {
    this.dataService.getMainScopes().subscribe((s) => { this.mainScopes = s; this.cdr.detectChanges(); });
    this.dataService.getPayments().subscribe((p) => {
      this.payments = p;
      this.buildGroups();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  applyFilter(event: Event) {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase();
    this.buildGroups();
  }

  private buildGroups() {
    let filtered = this.payments;
    if (this.filterText) {
      filtered = filtered.filter((p) =>
        (p.mainScopeName?.toLowerCase().includes(this.filterText)) ||
        (p.subScope?.toLowerCase().includes(this.filterText)) ||
        (p.notes?.toLowerCase().includes(this.filterText))
      );
    }

    this.totalReceived = filtered.reduce((s, p) => s + (p.receivedEGP || 0), 0);
    this.totalMine = filtered.reduce((s, p) => s + (p.mineEGP || 0), 0);
    this.totalGod = filtered.reduce((s, p) => s + (p.godAmount || 0), 0);
    this.totalCount = filtered.length;

    // Group by mainScopeName
    const map = new Map<string, Payment[]>();
    for (const p of filtered) {
      const key = p.mainScopeName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }

    this.projectGroups = Array.from(map.entries())
      .map(([scopeName, payments]) => ({
        scopeName,
        scopeId: payments[0]?.mainScopeId || scopeName,
        payments,
        totalReceived: payments.reduce((s, p) => s + (p.receivedEGP || 0), 0),
        totalMine: payments.reduce((s, p) => s + (p.mineEGP || 0), 0),
        totalGod: payments.reduce((s, p) => s + (p.godAmount || 0), 0),
        count: payments.length,
      }))
      .sort((a, b) => b.totalReceived - a.totalReceived);
  }

  openDialog(payment?: Payment) {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { payment, mainScopes: this.mainScopes },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        if (payment) {
          await this.dataService.updatePayment(payment.id, result);
          this.snackBar.open('Payment updated', 'OK', { duration: 2000 });
        } else {
          await this.dataService.addPayment(result);
          this.snackBar.open('Payment added', 'OK', { duration: 2000 });
        }
      } catch (e) {
        this.snackBar.open('Error saving payment', 'OK', { duration: 3000 });
      }
    });
  }

  async deletePayment(payment: Payment) {
    if (!confirm(`Delete payment "${payment.subScope}" from ${payment.mainScopeName}?`)) return;
    try {
      await this.dataService.deletePayment(payment.id);
      this.snackBar.open('Payment deleted', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error deleting payment', 'OK', { duration: 3000 });
    }
  }
}
