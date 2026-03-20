import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DataService } from '../../core/services';
import { AmountVisibilityService } from '../../core/services/amount-visibility.service';
import { Employee, SalaryPayment } from '../../core/models';
import { SalaryDialogComponent } from './salary-dialog.component';

@Component({
  selector: 'app-salaries',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatCardModule, MatFormFieldModule,
    MatSelectModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-intro">
      <div class="intro-text">
        <h1>Salary Payments</h1>
        <p>Track employee compensation</p>
      </div>
      <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
        <mat-icon>add</mat-icon> Add Payment
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap purple">
          <mat-icon>receipt_long</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ filteredItems.length }}</span>
          <span class="stat-label">Total Payments</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrap red">
          <mat-icon>paid</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ (amountVis.hidden$ | async) ? '•••' : (totalAmount | number:'1.0-0') }}</span>
          <span class="stat-label">Total Amount (EGP)</span>
        </div>
      </div>
    </div>

    <mat-card class="filter-card">
      <mat-form-field appearance="outline">
        <mat-label>Filter by Employee</mat-label>
        <mat-select (selectionChange)="filterByEmployee($event.value)" [value]="''">
          <mat-option value="">All Employees</mat-option>
          @for (emp of employees; track emp.id) {
            <mat-option [value]="emp.id">{{ emp.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-card>

    <mat-card class="table-card">
      <table mat-table [dataSource]="paginatedItems" matSort (matSortChange)="sortData($event)">
        <ng-container matColumnDef="employeeName">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Employee</th>
          <td mat-cell *matCellDef="let row" class="name-cell">{{ row.employeeName }}</td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
          <td mat-cell *matCellDef="let row">{{ row.date | date:'MMM yyyy' }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount (EGP)</th>
          <td mat-cell *matCellDef="let row" class="num-cell">{{ (amountVis.hidden$ | async) ? '•••' : (row.amount | number:'1.0-0') }}</td>
        </ng-container>
        <ng-container matColumnDef="comments">
          <th mat-header-cell *matHeaderCellDef>Comments</th>
          <td mat-cell *matCellDef="let row" class="comment-cell">{{ row.comments }}</td>
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
      <mat-paginator [length]="filteredItems.length" [pageSize]="10" [pageSizeOptions]="[5, 10, 25, 50]"
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
      gap: 16px; margin-bottom: 20px;
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
    .stat-icon-wrap.purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
    .stat-icon-wrap.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }

    .filter-card {
      margin-bottom: 16px; padding: 16px 20px 0 !important;
    }
    .filter-card mat-form-field { width: 100%; }

    .table-card { padding: 0 !important; overflow: hidden; }
    table { width: 100%; }
    .name-cell { font-weight: 600; color: var(--text-primary); }
    .num-cell { font-variant-numeric: tabular-nums; font-weight: 500; }
    .comment-cell { color: var(--text-secondary); font-size: 13px; }

    @media (max-width: 599px) {
      .page-intro { flex-direction: column; align-items: flex-start; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SalariesComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  amountVis = inject(AmountVisibilityService);

  items: SalaryPayment[] = [];
  filteredItems: SalaryPayment[] = [];
  paginatedItems: SalaryPayment[] = [];
  employees: Employee[] = [];
  displayedColumns = ['employeeName', 'date', 'amount', 'comments', 'actions'];
  totalAmount = 0;
  selectedEmployeeId = '';
  pageSize = 10;
  pageIndex = 0;

  ngOnInit() {
    this.dataService.getEmployees().subscribe((emps) => {
      this.employees = emps;
      this.load();
      this.cdr.detectChanges();
    });
  }

  load() {
    this.dataService.getSalaryPayments().subscribe((items) => {
      this.items = items.map((item) => ({
        ...item,
        employeeName: this.employees.find((e) => e.id === item.employeeId)?.name || item.employeeName || 'Unknown',
      }));
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  filterByEmployee(employeeId: string) {
    this.selectedEmployeeId = employeeId;
    this.pageIndex = 0;
    this.applyFilter();
  }

  applyFilter() {
    this.filteredItems = this.selectedEmployeeId
      ? this.items.filter((i) => i.employeeId === this.selectedEmployeeId)
      : [...this.items];
    this.totalAmount = this.filteredItems.reduce((s, i) => s + (i.amount || 0), 0);
    this.paginate();
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      this.applyFilter();
      return;
    }
    this.filteredItems.sort((a, b) => {
      const aVal = (a as any)[sort.active];
      const bVal = (b as any)[sort.active];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    this.paginate();
  }

  onPage(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.paginate();
  }

  paginate() {
    const start = this.pageIndex * this.pageSize;
    this.paginatedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  openDialog(item?: SalaryPayment) {
    this.dialog.open(SalaryDialogComponent, { width: '500px', data: { item, employees: this.employees } })
      .afterClosed().subscribe((result) => {
        if (!result) return;
        const emp = this.employees.find((e) => e.id === result.employeeId);
        result.employeeName = emp?.name || '';
        const op = item
          ? this.dataService.updateSalaryPayment(item.id!, result)
          : this.dataService.addSalaryPayment(result);
        op.then(() => { this.snackBar.open('Saved!', 'OK', { duration: 2000 }); this.load(); });
      });
  }

  delete(item: SalaryPayment) {
    if (!confirm('Delete this salary payment?')) return;
    this.dataService.deleteSalaryPayment(item.id!).then(() => {
      this.snackBar.open('Deleted', 'OK', { duration: 2000 });
      this.load();
    });
  }
}
