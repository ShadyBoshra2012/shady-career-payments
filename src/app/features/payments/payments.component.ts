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
import { AmountVisibilityService } from '../../core/services/amount-visibility.service';
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

type PeriodPreset = 'all-time' | 'current-year' | 'last-week' | 'last-month' | 'last-year' | 'year-before' | 'two-years' | 'three-years' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
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
      <div class="page-intro">
        <div class="intro-text">
          <h1>Payments</h1>
          <p>Track all project income and splits</p>
        </div>

        <div class="intro-actions">
          <mat-card class="period-filter-card">
            <div class="period-filter-row">
              <mat-form-field appearance="outline" class="period-field">
                <mat-label>Period</mat-label>
                <mat-select [value]="selectedPeriod" (selectionChange)="onPeriodChange($event.value)">
                  @for (option of periodOptions; track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (selectedPeriod === 'custom') {
                <mat-form-field appearance="outline" class="date-field">
                  <mat-label>From</mat-label>
                  <input matInput [matDatepicker]="fromPicker" [value]="customFromDate" (dateChange)="onCustomFromDateChange($event.value)" />
                  <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fromPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="date-field">
                  <mat-label>To</mat-label>
                  <input matInput [matDatepicker]="toPicker" [value]="customToDate" (dateChange)="onCustomToDateChange($event.value)" />
                  <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                  <mat-datepicker #toPicker></mat-datepicker>
                </mat-form-field>

                <button mat-flat-button color="primary" (click)="applyPeriodFilter()" [disabled]="!canApplyCustomRange()">Apply</button>
              }
            </div>
          </mat-card>

          <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
            <mat-icon>add</mat-icon> New Payment
          </button>
        </div>
      </div>

      <div class="search-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Search payments...</mat-label>
          <input matInput (input)="applyFilter($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="stats-grid">
        <div class="stat-card received">
          <div class="stat-icon-wrap">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ totalReceived | number:'1.0-0' }}</span>
            <span class="stat-label">Total Received (EGP)</span>
          </div>
        </div>
        <div class="stat-card mine">
          <div class="stat-icon-wrap">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ totalMine | number:'1.0-0' }}</span>
            <span class="stat-label">My Earnings (EGP)</span>
          </div>
        </div>
        <div class="stat-card god">
          <div class="stat-icon-wrap">
            <mat-icon>volunteer_activism</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ totalGod | number:'1.0-0' }}</span>
            <span class="stat-label">God's Money (EGP)</span>
          </div>
        </div>
        <div class="stat-card count">
          <div class="stat-icon-wrap">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Records</span>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h3>Projects</h3>
        <span class="section-count">{{ projectGroups.length }}</span>
      </div>

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
                  <span class="chip received-chip" [class.blurred]="amountVis.hidden$ | async">{{ group.totalReceived | number:'1.0-0' }} EGP</span>
                  <span class="chip mine-chip" [class.blurred]="amountVis.hidden$ | async">{{ group.totalMine | number:'1.0-0' }} EGP</span>
                  <span class="chip god-chip" [class.blurred]="amountVis.hidden$ | async">{{ group.totalGod | number:'1.0-0' }} EGP</span>
                </div>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="table-container">
              <table mat-table [dataSource]="group.payments" multiTemplateDataRows>
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
                  <td mat-cell *matCellDef="let p" class="num-cell" [class.blurred]="amountVis.hidden$ | async">{{ p.receivedEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="mineEGP">
                  <th mat-header-cell *matHeaderCellDef>Mine</th>
                  <td mat-cell *matCellDef="let p" class="num-cell" [class.blurred]="amountVis.hidden$ | async">{{ p.mineEGP | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godAmount">
                  <th mat-header-cell *matHeaderCellDef>God</th>
                  <td mat-cell *matCellDef="let p" class="num-cell" [class.blurred]="amountVis.hidden$ | async">{{ p.godAmount | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="godPercentage">
                  <th mat-header-cell *matHeaderCellDef>God %</th>
                  <td mat-cell *matCellDef="let p" class="num-cell" [class.blurred]="amountVis.hidden$ | async">{{ p.godPercentage | number:'1.1-1' }}%</td>
                </ng-container>
                <ng-container matColumnDef="splits">
                  <th mat-header-cell *matHeaderCellDef>Splits</th>
                  <td mat-cell *matCellDef="let p">
                    @if (p.others?.length) {
                      <button mat-button class="splits-badge" (click)="toggleRow(p); $event.stopPropagation()">
                        <mat-icon class="splits-icon">people</mat-icon>
                        {{ p.others.length }}
                      </button>
                    } @else {
                      <span class="no-splits">&mdash;</span>
                    }
                  </td>
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

                <!-- Expanded detail row -->
                <ng-container matColumnDef="expandedDetail">
                  <td mat-cell *matCellDef="let p" [attr.colspan]="displayedColumns.length">
                    @if (expandedPayment === p) {
                      <div class="split-detail">
                        <div class="split-detail-header">
                          <mat-icon>call_split</mat-icon>
                          <span>Payment Splits</span>
                          <span class="split-total" [class.blurred]="amountVis.hidden$ | async">Total: {{ getSplitTotal(p) | number:'1.0-0' }} EGP</span>
                        </div>
                        <div class="split-items">
                          @for (split of p.others; track $index) {
                            <div class="split-item">
                              <div class="split-person">
                                <mat-icon class="split-person-icon">person</mat-icon>
                                <span>{{ split.personName }}</span>
                              </div>
                              <span class="split-amount" [class.blurred]="amountVis.hidden$ | async">{{ split.amount | number:'1.0-0' }} EGP</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    [class.expanded-row]="expandedPayment === row"
                    [class.has-splits]="row.others?.length"></tr>
                <tr mat-row *matRowDef="let row; columns: ['expandedDetail']"
                    class="detail-row"
                    [class.detail-visible]="expandedPayment === row"></tr>
              </table>
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 48px; }

    .page-intro {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
    }
    .intro-text h1 {
      font-size: 26px; font-weight: 700; margin: 0 0 2px;
      color: var(--text-primary); letter-spacing: -0.3px;
    }
    .intro-text p {
      font-size: 14px; color: var(--text-muted); margin: 0;
    }
    .add-btn {
      border-radius: 12px !important;
      font-weight: 600 !important;
    }

    .intro-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .search-row { margin-bottom: 16px; }
    .filter-field { width: 100%; }

    .period-filter-card {
      margin-bottom: 0;
      padding: 12px 14px 0 !important;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(67, 97, 238, 0.18);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 249, 255, 0.95) 100%);
      box-shadow: 0 12px 24px rgba(31, 41, 55, 0.08);
    }
    .period-filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;
    }
    .period-field {
      width: 240px;
      max-width: 100%;
    }
    .date-field {
      width: 200px;
      max-width: 100%;
    }

    /* ---- Summary stat cards ---- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px; margin-bottom: 28px;
    }
    .stat-card {
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: center; gap: 14px;
      color: #fff; position: relative; overflow: hidden;
    }
    .stat-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.2); flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon {
      font-size: 24px; width: 24px; height: 24px;
    }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
    .stat-label { font-size: 12px; opacity: .75; font-weight: 500; margin-top: 2px; }
    .stat-card.received { background: linear-gradient(135deg, #4361ee, #3651d4); }
    .stat-card.mine { background: linear-gradient(135deg, #0ead69, #059652); }
    .stat-card.god { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-card.count { background: linear-gradient(135deg, #7c3aed, #6d28d9); }

    /* ---- Section header ---- */
    .section-header {
      display: flex; align-items: center; gap: 10px;
      margin: 0 0 14px 2px;
    }
    .section-header h3 {
      font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;
    }
    .section-count {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--accent-blue-soft); color: var(--accent-blue);
      font-size: 12px; font-weight: 700; border-radius: 8px;
      padding: 2px 10px; height: 24px;
    }

    /* ---- Project panels ---- */
    .project-panel { margin-bottom: 8px !important; }
    .project-rank {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 8px;
      background: var(--accent-blue-soft); color: var(--accent-blue);
      font-size: 12px; font-weight: 700; margin-right: 10px; flex-shrink: 0;
    }
    .project-name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--accent-blue); color: #fff; border-radius: 8px;
      font-size: 11px; min-width: 22px; height: 20px; padding: 0 7px; margin-left: 8px;
      font-weight: 600;
    }
    .panel-stats { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: inline-block; padding: 4px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .received-chip { background: rgba(67,97,238,0.08); color: #4361ee; }
    .mine-chip { background: rgba(14,173,105,0.08); color: #059652; }
    .god-chip { background: rgba(245,158,11,0.08); color: #b45309; }

    /* ---- Table inside panels ---- */
    .table-container { overflow-x: auto; margin-top: 8px; }
    table { width: 100%; }
    .num-cell { font-variant-numeric: tabular-nums; font-weight: 500; }

    /* Splits badge */
    .splits-badge {
      min-width: 0; padding: 2px 10px; border-radius: 8px;
      font-size: 12px; font-weight: 600; line-height: 1;
      background: rgba(124, 58, 237, 0.08); color: #7c3aed;
    }
    .splits-icon {
      font-size: 16px; width: 16px; height: 16px; margin-right: 4px;
    }
    .no-splits { color: var(--text-muted); }

    /* Expandable detail row */
    .detail-row { height: 0; }
    .detail-row td { padding: 0 !important; border-bottom-width: 0 !important; }
    .detail-visible td { border-bottom-width: 1px !important; }
    .expanded-row { font-weight: 500; }
    .has-splits { cursor: pointer; }

    .split-detail {
      padding: 12px 16px 16px;
      background: var(--surface);
      border-radius: 0 0 var(--radius-md) var(--radius-md);
    }
    .split-detail-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: var(--text-primary);
      margin-bottom: 10px;
    }
    .split-detail-header mat-icon {
      font-size: 18px; width: 18px; height: 18px; color: #7c3aed;
    }
    .split-total {
      margin-left: auto; font-size: 12px; font-weight: 700;
      color: #7c3aed; background: rgba(124, 58, 237, 0.08);
      padding: 3px 10px; border-radius: 6px;
    }
    .split-items {
      display: flex; flex-direction: column; gap: 6px;
    }
    .split-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border-radius: 8px;
      background: #fff; border: 1px solid var(--border);
    }
    .split-person {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 500; color: var(--text-primary);
    }
    .split-person-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--text-muted);
    }
    .split-amount {
      font-size: 13px; font-weight: 600; color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 599px) {
      .page-intro { flex-direction: column; align-items: flex-start; }
      .intro-actions {
        width: 100%;
        align-items: stretch;
      }
      .add-btn {
        align-self: flex-start;
      }
      .period-filter-card {
        padding: 12px 12px 0 !important;
      }
      .period-field,
      .date-field {
        width: 100%;
      }
      .period-filter-row {
        justify-content: stretch;
      }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-value { font-size: 18px; }
      .stat-card { padding: 14px; }
      .panel-stats { display: none; }
      .project-rank { width: 22px; height: 22px; font-size: 11px; }
    }
  `],
})
export class PaymentsComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  amountVis = inject(AmountVisibilityService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = true;
  periodOptions: Array<{ value: PeriodPreset; label: string }> = [
    { value: 'all-time', label: 'All the time' },
    { value: 'current-year', label: 'Current year' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'year-before', label: 'Year Before' },
    { value: 'two-years', label: '2 Years' },
    { value: 'three-years', label: '3 Years' },
    { value: 'custom', label: 'Custom Dates' },
  ];
  selectedPeriod: PeriodPreset = 'two-years';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;

  allPayments: Payment[] = [];
  payments: Payment[] = [];
  mainScopes: MainScope[] = [];
  projectGroups: ProjectGroup[] = [];

  displayedColumns = ['subScope', 'date', 'receivedEGP', 'mineEGP', 'godAmount', 'godPercentage', 'splits', 'actions'];
  expandedPayment: Payment | null = null;
  filterText = '';

  totalReceived = 0;
  totalMine = 0;
  totalGod = 0;
  totalCount = 0;

  ngOnInit() {
    this.dataService.getMainScopes().subscribe((s) => { this.mainScopes = s; this.cdr.detectChanges(); });
    this.dataService.getPayments().subscribe((p) => {
      this.allPayments = p;
      this.applyPeriodFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  onPeriodChange(period: PeriodPreset) {
    this.selectedPeriod = period;
    if (period !== 'custom') {
      this.applyPeriodFilter();
    }
  }

  onCustomFromDateChange(date: Date | null) {
    this.customFromDate = date;
  }

  onCustomToDateChange(date: Date | null) {
    this.customToDate = date;
  }

  canApplyCustomRange(): boolean {
    if (!this.customFromDate || !this.customToDate) {
      return false;
    }
    return this.startOfDay(this.customFromDate) <= this.endOfDay(this.customToDate);
  }

  applyPeriodFilter() {
    const range = this.resolveDateRange();
    this.payments = this.filterByDateRange(this.allPayments, (item) => item.date, range);
    this.expandedPayment = null;
    this.buildGroups();
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

  toggleRow(payment: Payment) {
    this.expandedPayment = this.expandedPayment === payment ? null : payment;
  }

  getSplitTotal(payment: Payment): number {
    return (payment.others || []).reduce((s, o) => s + (o.amount || 0), 0);
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

  private resolveDateRange(): DateRange | null {
    const now = new Date();

    switch (this.selectedPeriod) {
      case 'all-time':
        return null;
      case 'current-year':
        return {
          from: this.startOfDay(new Date(now.getFullYear(), 0, 1)),
          to: this.endOfDay(now),
        };
      case 'last-week':
        return { from: this.startOfDay(this.addDays(now, -7)), to: this.endOfDay(now) };
      case 'last-month':
        return { from: this.startOfDay(this.addMonths(now, -1)), to: this.endOfDay(now) };
      case 'last-year':
        return { from: this.startOfDay(this.addYears(now, -1)), to: this.endOfDay(now) };
      case 'year-before':
        return {
          from: this.startOfDay(this.addYears(now, -2)),
          to: this.endOfDay(this.addYears(now, -1)),
        };
      case 'two-years':
        return { from: this.startOfDay(this.addYears(now, -2)), to: this.endOfDay(now) };
      case 'three-years':
        return { from: this.startOfDay(this.addYears(now, -3)), to: this.endOfDay(now) };
      case 'custom':
      default:
        if (this.customFromDate && this.customToDate) {
          return {
            from: this.startOfDay(this.customFromDate),
            to: this.endOfDay(this.customToDate),
          };
        }
        return { from: this.startOfDay(this.addYears(now, -2)), to: this.endOfDay(now) };
    }
  }

  private filterByDateRange<T>(items: T[], getDate: (item: T) => Date | string | undefined, range: DateRange | null): T[] {
    if (!range) {
      return [...items];
    }
    return items.filter((item) => {
      const rawDate = getDate(item);
      if (!rawDate) {
        return false;
      }
      const date = new Date(rawDate);
      return date >= range.from && date <= range.to;
    });
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addYears(date: Date, years: number): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }
}
