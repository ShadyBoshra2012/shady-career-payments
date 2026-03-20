import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DataService } from '../../core/services';
import { Employee } from '../../core/models';
import { EmployeeDialogComponent } from './employee-dialog.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Employees</h1>
      <button mat-fab color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="sortedItems" matSort (matSortChange)="sortData($event)">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Position</th>
          <td mat-cell *matCellDef="let row">{{ row.position }}</td>
        </ng-container>
        <ng-container matColumnDef="baseSalary">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Base Salary</th>
          <td mat-cell *matCellDef="let row">{{ row.baseSalary | number:'1.0-0' }} EGP</td>
        </ng-container>
        <ng-container matColumnDef="paymentMethod">
          <th mat-header-cell *matHeaderCellDef>Payment Method</th>
          <td mat-cell *matCellDef="let row">{{ row.paymentMethod }}</td>
        </ng-container>
        <ng-container matColumnDef="isActive">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [highlighted]="row.isActive" [color]="row.isActive ? 'primary' : 'warn'">
              {{ row.isActive ? 'Active' : 'Inactive' }}
            </mat-chip>
          </td>
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
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    table { width: 100%; }
  `],
})
export class EmployeesComponent implements OnInit {
  private dataService = inject(DataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  items: Employee[] = [];
  sortedItems: Employee[] = [];
  displayedColumns = ['name', 'position', 'baseSalary', 'paymentMethod', 'isActive', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.dataService.getEmployees().subscribe((items) => {
      this.items = items;
      this.sortedItems = [...items];
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
