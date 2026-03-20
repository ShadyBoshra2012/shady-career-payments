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
    <div class="page-header">
      <h1>God's Money</h1>
      <button mat-fab color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <div class="stats-row">
      <mat-card>
        <mat-card-content>
          <div class="stat-label">Total Accumulated</div>
          <div class="stat-value">{{ totalAccumulated | number:'1.0-0' }} EGP</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <div class="stat-label">Total Disbursed</div>
          <div class="stat-value">{{ totalDisbursed | number:'1.0-0' }} EGP</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <div class="stat-label">Remaining Balance</div>
          <div class="stat-value balance" [class.negative]="balance < 0">{{ balance | number:'1.0-0' }} EGP</div>
        </mat-card-content>
      </mat-card>
    </div>

    <mat-card>
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
          <td mat-cell *matCellDef="let row">{{ row.priceEGP | number:'1.0-0' }}</td>
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
          <th mat-header-cell *matHeaderCellDef>Actions</th>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .stat-label { font-size: 12px; color: #666; }
    .stat-value { font-size: 24px; font-weight: 600; }
    .balance { color: #2e7d32; }
    .balance.negative { color: #c62828; }
    table { width: 100%; }
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
