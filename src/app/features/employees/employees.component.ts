import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DataService } from '../../core/services';
import { AmountVisibilityService } from '../../core/services/amount-visibility.service';
import { Employee } from '../../core/models';
import { EmployeeDialogComponent } from './employee-dialog.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatCardModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-intro">
      <div class="intro-text">
        <h1>Employees</h1>
        <p>Manage your team members</p>
      </div>
      <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
        <mat-icon>add</mat-icon> Add Employee
      </button>
    </div>

    <mat-card class="table-card">
      <table mat-table [dataSource]="sortedItems" matSort (matSortChange)="sortData($event)">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let row" class="name-cell">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Position</th>
          <td mat-cell *matCellDef="let row">{{ row.position }}</td>
        </ng-container>
        <ng-container matColumnDef="baseSalary">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Base Salary</th>
          <td mat-cell *matCellDef="let row" class="num-cell">{{ (amountVis.hidden$ | async) ? '•••' : ((row.baseSalary | number:'1.0-0') + ' EGP') }}</td>
        </ng-container>
        <ng-container matColumnDef="paymentMethod">
          <th mat-header-cell *matHeaderCellDef>Payment Method</th>
          <td mat-cell *matCellDef="let row">
            <span class="method-chip">{{ row.paymentMethod }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="isActive">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="status-badge" [class.active]="row.isActive" [class.inactive]="!row.isActive">
              {{ row.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
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

    .table-card { padding: 0 !important; overflow: hidden; }
    table { width: 100%; }
    .name-cell { font-weight: 600; color: var(--text-primary); }
    .num-cell { font-variant-numeric: tabular-nums; font-weight: 500; }

    .method-chip {
      display: inline-block; padding: 4px 12px;
      background: var(--accent-blue-soft); color: var(--accent-blue);
      border-radius: 8px; font-size: 12px; font-weight: 600;
    }
    .status-badge {
      display: inline-block; padding: 4px 12px;
      border-radius: 8px; font-size: 12px; font-weight: 600;
    }
    .status-badge.active {
      background: rgba(14,173,105,0.1); color: #059652;
    }
    .status-badge.inactive {
      background: rgba(239,68,68,0.1); color: #dc2626;
    }

    @media (max-width: 599px) {
      .page-intro { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class EmployeesComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  amountVis = inject(AmountVisibilityService);

  items: Employee[] = [];
  sortedItems: Employee[] = [];
  displayedColumns = ['name', 'position', 'baseSalary', 'paymentMethod', 'isActive', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.dataService.getEmployees().subscribe((items) => {
      this.items = items;
      this.sortedItems = [...items];
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
  }

  openDialog(item?: Employee) {
    this.dialog.open(EmployeeDialogComponent, { width: '500px', data: { item } }).afterClosed().subscribe((result) => {
      if (!result) return;
      const op = item
        ? this.dataService.updateEmployee(item.id!, result)
        : this.dataService.addEmployee(result);
      op.then(() => { this.snackBar.open('Saved!', 'OK', { duration: 2000 }); this.load(); });
    });
  }

  delete(item: Employee) {
    if (!confirm('Delete this employee?')) return;
    this.dataService.deleteEmployee(item.id!).then(() => {
      this.snackBar.open('Deleted', 'OK', { duration: 2000 });
      this.load();
    });
  }
}
