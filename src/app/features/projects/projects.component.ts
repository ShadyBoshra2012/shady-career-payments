import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataService } from '../../core/services/data.service';
import { MainScope, Payment } from '../../core/models';
import { ProjectDialogComponent } from './project-dialog.component';

interface ProjectRow extends MainScope {
  paymentCount: number;
  totalReceived: number;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatTooltipModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="page-intro">
        <div class="intro-text">
          <h1>Projects & Employers</h1>
          <p>Manage your income sources</p>
        </div>
        <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
          <mat-icon>add</mat-icon> New Project
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon-wrap">
            <mat-icon>business</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ projects.length }}</span>
            <span class="stat-label">Total Projects</span>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon-wrap">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ activeCount }}</span>
            <span class="stat-label">With Payments</span>
          </div>
        </div>
        <div class="stat-card revenue">
          <div class="stat-icon-wrap">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ totalRevenue | number:'1.0-0' }}</span>
            <span class="stat-label">Total Revenue (EGP)</span>
          </div>
        </div>
      </div>

      <div class="search-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Search projects...</mat-label>
          <input matInput (input)="applyFilter($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="table-card">
        <table mat-table [dataSource]="filteredProjects">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Project / Employer</th>
            <td mat-cell *matCellDef="let p" class="name-cell">{{ p.name }}</td>
          </ng-container>
          <ng-container matColumnDef="paymentCount">
            <th mat-header-cell *matHeaderCellDef>Payments</th>
            <td mat-cell *matCellDef="let p">
              <span class="count-badge">{{ p.paymentCount }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="totalReceived">
            <th mat-header-cell *matHeaderCellDef>Total Received</th>
            <td mat-cell *matCellDef="let p" class="num-cell">{{ p.totalReceived | number:'1.0-0' }} EGP</td>
          </ng-container>
          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let p" class="notes-cell">{{ p.notes || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button (click)="openDialog(p)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteProject(p)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
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
    .intro-text p { font-size: 14px; color: var(--text-muted); margin: 0; }
    .add-btn { border-radius: 12px !important; font-weight: 600 !important; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px; margin-bottom: 20px;
    }
    .stat-card {
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: center; gap: 14px;
      color: #fff; overflow: hidden;
    }
    .stat-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.2); flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
    .stat-label { font-size: 12px; opacity: .75; font-weight: 500; margin-top: 2px; }
    .stat-card.total { background: linear-gradient(135deg, #4361ee, #3651d4); }
    .stat-card.active { background: linear-gradient(135deg, #0ead69, #059652); }
    .stat-card.revenue { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .search-row { margin-bottom: 16px; }
    .filter-field { width: 100%; }

    .table-card {
      background: #fff; border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
    }
    table { width: 100%; }
    .name-cell { font-weight: 600; color: var(--text-primary); }
    .num-cell { font-variant-numeric: tabular-nums; font-weight: 500; }
    .notes-cell { color: var(--text-muted); font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--accent-blue-soft, rgba(67,97,238,0.08)); color: var(--accent-blue, #4361ee);
      font-size: 12px; font-weight: 700; border-radius: 8px;
      padding: 2px 10px; height: 24px;
    }

    @media (max-width: 599px) {
      .page-intro { flex-direction: column; align-items: flex-start; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-value { font-size: 18px; }
      .stat-card { padding: 14px; }
    }
  `],
})
export class ProjectsComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = true;
  projects: ProjectRow[] = [];
  filteredProjects: ProjectRow[] = [];
  payments: Payment[] = [];
  filterText = '';

  displayedColumns = ['name', 'paymentCount', 'totalReceived', 'notes', 'actions'];

  activeCount = 0;
  totalRevenue = 0;

  ngOnInit() {
    this.dataService.getPayments().subscribe((p) => {
      this.payments = p;
      this.enrichProjects();
    });
    this.dataService.getMainScopes().subscribe((scopes) => {
      this.projects = scopes.map((s) => ({ ...s, paymentCount: 0, totalReceived: 0 }));
      this.enrichProjects();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private enrichProjects() {
    if (!this.projects.length) return;
    for (const proj of this.projects) {
      const matching = this.payments.filter((p) => p.mainScopeId === proj.id || p.mainScopeName === proj.name);
      proj.paymentCount = matching.length;
      proj.totalReceived = matching.reduce((s, p) => s + (p.receivedEGP || 0), 0);
    }
    this.activeCount = this.projects.filter((p) => p.paymentCount > 0).length;
    this.totalRevenue = this.projects.reduce((s, p) => s + p.totalReceived, 0);
    this.applyFilterInternal();
    this.cdr.detectChanges();
  }

  applyFilter(event: Event) {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilterInternal();
  }

  private applyFilterInternal() {
    if (!this.filterText) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter((p) =>
        p.name.toLowerCase().includes(this.filterText) ||
        (p.notes?.toLowerCase().includes(this.filterText))
      );
    }
  }

  openDialog(project?: ProjectRow) {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: { project },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        if (project) {
          await this.dataService.updateMainScope(project.id, result);
          this.snackBar.open('Project updated', 'OK', { duration: 2000 });
        } else {
          await this.dataService.addMainScope(result);
          this.snackBar.open('Project added', 'OK', { duration: 2000 });
        }
      } catch {
        this.snackBar.open('Error saving project', 'OK', { duration: 3000 });
      }
    });
  }

  async deleteProject(project: ProjectRow) {
    if (project.paymentCount > 0) {
      this.snackBar.open(`Cannot delete "${project.name}" — it has ${project.paymentCount} payments linked`, 'OK', { duration: 4000 });
      return;
    }
    if (!confirm(`Delete project "${project.name}"?`)) return;
    try {
      await this.dataService.deleteMainScope(project.id);
      this.snackBar.open('Project deleted', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error deleting project', 'OK', { duration: 3000 });
    }
  }
}
