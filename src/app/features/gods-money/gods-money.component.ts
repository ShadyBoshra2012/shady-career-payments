import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DataService } from '../../core/services';
import { GodsMoney } from '../../core/models';
import { GodsMoneyDialogComponent } from './gods-money-dialog.component';

@Component({
  selector: 'app-gods-money',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-intro">
      <div class="intro-text">
        <h1>God's Money</h1>
        <p>Track disbursements and remaining balance</p>
      </div>
      <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
        <mat-icon>add</mat-icon> Add Entry
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap orange">
          <mat-icon>savings</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalAccumulated | number:'1.0-0' }}</span>
          <span class="stat-label">Total Accumulated (EGP)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap red">
          <mat-icon>send</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalDisbursed | number:'1.0-0' }}</span>
          <span class="stat-label">Total Disbursed (EGP)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap" [class.green]="balance >= 0" [class.red-negative]="balance < 0">
          <mat-icon>account_balance</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value" [class.negative]="balance < 0">{{ balance | number:'1.0-0' }}</span>
          <span class="stat-label">Remaining Balance (EGP)</span>
        </div>
      </div>
    </div>

    <mat-card class="table-card">
      <table mat-table [dataSource]="paginatedItems" matSort (matSortChange)="sortData($event)">
        <ng-container matColumnDef="responsibleTo">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Responsible To</th>
          <td mat-cell *matCellDef="let row">{{ row.responsibleTo }}</td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>
        <ng-container matColumnDef="priceEGP">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount (EGP)</th>
          <td mat-cell *matCellDef="let row" class="num-cell">{{ row.priceEGP | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="sendingDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Sending Date</th>
          <td mat-cell *matCellDef="let row">{{ row.sendingDate | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="executionDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Execution Date</th>
          <td mat-cell *matCellDef="let row">{{ row.executionDate | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openDialog(row)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="delete(row)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <mat-paginator [length]="sortedItems.length" [pageSize]="10" [pageSizeOptions]="[5, 10, 25]"
        (page)="onPage($event)"></mat-paginator>
    </mat-card>
  `,
  styles: [`
    .page-intro {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
    }
    .intro-text h1 {
      font-size: 26px; font-weight: 700; margin: 0 0 2px;
      color: var(--text-primary); letter-spacing: -0.3px;
    }
    .intro-text p { font-size: 14px; color: var(--text-muted); margin: 0; }
    .add-btn { border-radius: 12px !important; font-weight: 600 !important; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px; background: var(--surface-card);
      border-radius: var(--radius-lg); border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .stat-icon-wrap {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; color: #fff; }
    .stat-icon-wrap.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-icon-wrap.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-icon-wrap.green { background: linear-gradient(135deg, #0ead69, #059652); }
    .stat-icon-wrap.red-negative { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
    .stat-value.negative { color: var(--accent-red); }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }

    .table-card { padding: 0 !important; overflow: hidden; }
    table { width: 100%; }
    .num-cell { font-variant-numeric: tabular-nums; font-weight: 500; }

    @media (max-width: 599px) {
      .page-intro { flex-direction: column; align-items: flex-start; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class GodsMoneyComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items: GodsMoney[] = [];
  sortedItems: GodsMoney[] = [];
  paginatedItems: GodsMoney[] = [];
  displayedColumns = ['responsibleTo', 'title', 'priceEGP', 'sendingDate', 'executionDate', 'actions'];
  totalAccumulated = 0;
  totalDisbursed = 0;
  balance = 0;
  pageSize = 10;
  pageIndex = 0;

  ngOnInit() { this.load(); }

  load() {
    this.dataService.getGodsMoney().subscribe((items) => {
      this.items = items;
      this.totalDisbursed = items.reduce((s, i) => s + (i.priceEGP || 0), 0);
      this.sortedItems = [...items];
      this.paginate();
      // Get accumulated from payments
      this.dataService.getPayments().subscribe((payments) => {
        this.totalAccumulated = payments.reduce((s, p) => s + (p.godAmount || 0), 0);
        this.balance = this.totalAccumulated - this.totalDisbursed;
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    });
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      this.sortedItems = [...this.items];
    } else {
      this.sortedItems = [...this.items].sort((a, b) => {
        const aVal = (a as any)[sort.active];
        const bVal = (b as any)[sort.active];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    this.paginate();
  }

  onPage(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.paginate();
  }

  paginate() {
    const start = this.pageIndex * this.pageSize;
    this.paginatedItems = this.sortedItems.slice(start, start + this.pageSize);
  }

  openDialog(item?: GodsMoney) {
    this.dialog.open(GodsMoneyDialogComponent, { width: '600px', data: { item } }).afterClosed().subscribe((result) => {
      if (!result) return;
      const op = item
        ? this.dataService.updateGodsMoney(item.id!, result)
        : this.dataService.addGodsMoney(result);
      op.then(() => { this.snackBar.open('Saved!', 'OK', { duration: 2000 }); this.load(); });
    });
  }

  delete(item: GodsMoney) {
    if (!confirm('Delete this entry?')) return;
    this.dataService.deleteGodsMoney(item.id!).then(() => {
      this.snackBar.open('Deleted', 'OK', { duration: 2000 });
      this.load();
    });
  }
}
