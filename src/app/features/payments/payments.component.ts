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
          <mat-label>Search payments...</mat-label>
          <input matInput (input)="applyFilter($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <button mat-fab extended color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> New Payment
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card received">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ totalReceived | number:'1.0-0' }}</span>
            <span class="stat-unit">EGP</span>
          </div>
          <span class="stat-label">Total Received</span>
        </div>
        <div class="stat-card mine">
          <mat-icon>account_balance_wallet</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ totalMine | number:'1.0-0' }}</span>
            <span class="stat-unit">EGP</span>
          </div>
          <span class="stat-label">My Earnings</span>
        </div>
        <div class="stat-card god">
          <mat-icon>volunteer_activism</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ totalGod | number:'1.0-0' }}</span>
            <span class="stat-unit">EGP</span>
          </div>
          <span class="stat-label">God's Money</span>
        </div>
        <div class="stat-card count">
          <mat-icon>receipt_long</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ totalCount }}</span>
          </div>
          <span class="stat-label">Records</span>
        </div>
      </div>

      <h3 class="section-title">Projects ({{ projectGroups.length }})</h3>

      <mat-accordion multi>
        @for (group of projectGroups; track group.scopeId; let i = $index) {
          <mat-expansion-panel class="project-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <span class="project-rank">{{ i + 1 }}</span>
                <span class="project-name">{{ group.scopeName }}</span>
                <span class="badge">{{ group.count }}</span>
              </mat-panel-title>
              <mat-panel-description>
                <div class="panel-stats">
                  <span class="chip received-chip">{{ group.totalReceived | number:'1.0-0' }} EGP</span>
                  <span class="chip mine-chip">{{ group.totalMine | number:'1.0-0' }} EGP</span>
                  <span class="chip god-chip">{{ group.totalGod | number:'1.0-0' }} EGP</span>
                </div>
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
                  <th mat-header-cell *matHeaderCellDef>Received</th>
                  <td mat-cell *matCellDef="let p" class="num-cell">{{ p.receivedEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="mineEGP">
                  <th mat-header-cell *matHeaderCellDef>Mine</th>
                  <td mat-cell *matCellDef="let p" class="num-cell">{{ p.mineEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godAmount">
                  <th mat-header-cell *matHeaderCellDef>God</th>
                  <td mat-cell *matCellDef="let p" class="num-cell">{{ p.godAmount | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godPercentage">
                  <th mat-header-cell *matHeaderCellDef>God %</th>
                  <td mat-cell *matCellDef="let p" class="num-cell">{{ p.godPercentage | number:'1.1-1' }}%</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-icon-button (click)="openDialog(p)" matTooltip="Edit">
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

    .header-row {
      display: flex; flex-wrap: wrap; gap: 16px;
      align-items: center; margin-bottom: 20px;
    }
    .filter-field { flex: 1; min-width: 200px; }

    /* ---- Summary stat cards ---- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px; margin-bottom: 28px;
    }
    .stat-card {
      border-radius: 16px; padding: 20px;
      display: flex; flex-direction: column; gap: 4px;
      color: #fff; position: relative; overflow: hidden;
    }
    .stat-card mat-icon {
      font-size: 32px; width: 32px; height: 32px; opacity: .85;
    }
    .stat-body { display: flex; align-items: baseline; gap: 4px; }
    .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .stat-unit { font-size: 14px; font-weight: 500; opacity: .8; }
    .stat-label { font-size: 13px; opacity: .8; font-weight: 500; }
    .stat-card.received { background: linear-gradient(135deg, #1e88e5, #1565c0); }
    .stat-card.mine { background: linear-gradient(135deg, #43a047, #2e7d32); }
    .stat-card.god { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
    .stat-card.count { background: linear-gradient(135deg, #7e57c2, #5e35b1); }

    /* ---- Section title ---- */
    .section-title {
      font-size: 16px; font-weight: 600; color: #444;
      margin: 0 0 12px 4px;
    }

    /* ---- Project panels ---- */
    .project-panel { margin-bottom: 6px; border-radius: 12px !important; }
    .project-rank {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%;
      background: #e3f2fd; color: #1565c0;
      font-size: 13px; font-weight: 700; margin-right: 10px; flex-shrink: 0;
    }
    .project-name { font-weight: 600; font-size: 15px; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #1565c0; color: #fff; border-radius: 12px;
      font-size: 11px; min-width: 22px; height: 20px; padding: 0 7px; margin-left: 8px;
      font-weight: 600;
    }
    .panel-stats { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .received-chip { background: #e3f2fd; color: #1565c0; }
    .mine-chip { background: #e8f5e9; color: #2e7d32; }
    .god-chip { background: #fff3e0; color: #e65100; }

    /* ---- Table inside panels ---- */
    .table-container { overflow-x: auto; margin-top: 8px; }
    table { width: 100%; }
    th { font-weight: 600 !important; font-size: 13px; color: #555; }
    td { font-size: 14px; }
    .num-cell { font-variant-numeric: tabular-nums; }
    tr.mat-mdc-row:hover { background: #f5f5f5; }

    @media (max-width: 599px) {
      .header-row { flex-direction: column; }
      .filter-field { min-width: 100%; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-value { font-size: 20px; }
      .stat-card { padding: 14px; }
      .panel-stats { display: none; }
      .project-rank { width: 22px; height: 22px; font-size: 11px; }
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
