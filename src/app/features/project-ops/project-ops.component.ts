import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest } from 'rxjs';
import { DataService } from '../../core/services';
import { AmountVisibilityService } from '../../core/services/amount-visibility.service';
import { Employee, OpsProject, OpsProjectAssignment, OpsProjectStatus } from '../../core/models';
import { ProjectOpsDialogComponent } from './project-ops-dialog.component';

interface OpsSummary {
  totalProjects: number;
  totalContractValue: number;
  totalCollected: number;
  totalPending: number;
  overduePayments: number;
  activePeople: number;
}

@Component({
  selector: 'app-project-ops',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="page-intro">
        <div class="intro-copy">
          <h1>Project Ops</h1>
          <p>Plan and monitor upcoming/running projects, schedules, and team workload</p>
        </div>

        <button mat-fab extended color="primary" (click)="openDialog()" class="add-btn">
          <mat-icon>add</mat-icon>
          Add Ops Project
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon"><mat-icon>rocket_launch</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value">{{ summary.totalProjects }}</span>
            <span class="stat-label">Tracked Projects</span>
          </div>
        </div>

        <div class="stat-card contract">
          <div class="stat-icon"><mat-icon>request_quote</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ summary.totalContractValue | number:'1.0-0' }}</span>
            <span class="stat-label">Contract Value (EGP)</span>
          </div>
        </div>

        <div class="stat-card collected">
          <div class="stat-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ summary.totalCollected | number:'1.0-0' }}</span>
            <span class="stat-label">Collected (EGP)</span>
          </div>
        </div>

        <div class="stat-card pending">
          <div class="stat-icon"><mat-icon>schedule</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ summary.totalPending | number:'1.0-0' }}</span>
            <span class="stat-label">Pending (EGP)</span>
          </div>
        </div>

        <div class="stat-card overdue">
          <div class="stat-icon"><mat-icon>warning</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value">{{ summary.overduePayments }}</span>
            <span class="stat-label">Overdue Payments</span>
          </div>
        </div>

        <div class="stat-card team">
          <div class="stat-icon"><mat-icon>groups</mat-icon></div>
          <div class="stat-body">
            <span class="stat-value">{{ summary.activePeople }}</span>
            <span class="stat-label">People Assigned</span>
          </div>
        </div>
      </div>

      <div class="toolbar-row">
        <mat-tab-group [selectedIndex]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
          <mat-tab label="Upcoming"></mat-tab>
          <mat-tab label="Running"></mat-tab>
          <mat-tab label="On Hold"></mat-tab>
          <mat-tab label="All"></mat-tab>
        </mat-tab-group>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search by project, client, notes...</mat-label>
          <input matInput (input)="onSearch($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      @if (!visibleProjects.length) {
        <mat-card class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <h3>No projects match this view</h3>
          <p>Try changing tab/filter or add a new operations project.</p>
        </mat-card>
      } @else {
        <div class="projects-grid" [class.blurred]="amountVis.hidden$ | async">
          @for (project of visibleProjects; track project.id) {
            <mat-card class="project-card">
              <div class="project-head">
                <div>
                  <h3>{{ project.name }}</h3>
                  <p>{{ project.clientName }}</p>
                </div>
                <div class="chips-wrap">
                  <span class="chip status" [class.status-upcoming]="project.status === 'upcoming'" [class.status-running]="project.status === 'running'" [class.status-hold]="project.status === 'on-hold'" [class.status-completed]="project.status === 'completed'" [class.status-cancelled]="project.status === 'cancelled'">{{ project.status }}</span>
                  <span class="chip priority" [class.priority-high]="project.priority === 'high'" [class.priority-medium]="project.priority === 'medium'" [class.priority-low]="project.priority === 'low'">{{ project.priority }}</span>
                  <span class="chip health" [class.health-green]="project.health === 'green'" [class.health-yellow]="project.health === 'yellow'" [class.health-red]="project.health === 'red'">{{ project.health }}</span>
                </div>
              </div>

              <div class="progress-row">
                <div class="progress-meta">
                  <span>Timeline</span>
                  <span>{{ getProgress(project) }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" [style.width.%]="getProgress(project)"></div>
                </div>
                <div class="date-range">{{ project.startDate | date:'MMM d, y' }} - {{ project.expectedEndDate | date:'MMM d, y' }}</div>
              </div>

              <div class="project-body-grid">
                <div class="info-block">
                  <h4>Finance</h4>
                  <div class="kv"><span>Contract</span><strong>{{ project.contractValueEGP | number:'1.0-0' }} EGP</strong></div>
                  <div class="kv"><span>Collected</span><strong>{{ getCollected(project) | number:'1.0-0' }} EGP</strong></div>
                  <div class="kv"><span>Pending</span><strong>{{ getPending(project) | number:'1.0-0' }} EGP</strong></div>
                  <div class="kv"><span>Overdue</span><strong>{{ getOverdueCount(project) }}</strong></div>
                </div>

                <div class="info-block">
                  <h4>Team</h4>
                  @if (!project.assignments.length) {
                    <p class="empty-text">No assignments yet</p>
                  } @else {
                    @for (assignment of topAssignments(project.assignments); track assignment.employeeId + assignment.role) {
                      <div class="kv"><span>{{ assignment.employeeName || 'Unknown' }} ({{ assignment.role }})</span><strong>{{ assignment.allocationPercent }}%</strong></div>
                    }
                    @if (project.assignments.length > 3) {
                      <p class="extra-text">+{{ project.assignments.length - 3 }} more assignments</p>
                    }
                    <div class="kv"><span>Monthly salary allocation</span><strong>{{ estimateMonthlyCost(project) | number:'1.0-0' }} EGP</strong></div>
                  }
                </div>

                <div class="info-block">
                  <h4>Execution</h4>
                  <div class="kv"><span>Milestones</span><strong>{{ project.milestones.length }}</strong></div>
                  <div class="kv"><span>Done</span><strong>{{ doneMilestones(project) }}</strong></div>
                  <div class="kv"><span>Blocked</span><strong>{{ blockedMilestones(project) }}</strong></div>
                  <div class="kv"><span>Open risks</span><strong>{{ openRisks(project) }}</strong></div>
                </div>
              </div>

              @if (project.description) {
                <p class="description">{{ project.description }}</p>
              }

              <div class="actions-row">
                <button mat-stroked-button (click)="openDialog(project)">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-stroked-button color="warn" (click)="deleteProject(project)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </mat-card>
          }
        </div>
      }
    }
  `,
  styles: [`
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .page-intro {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .intro-copy h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }
    .intro-copy p {
      margin: 0;
      color: var(--text-muted);
      font-size: 14px;
    }
    .add-btn {
      border-radius: 12px !important;
      font-weight: 600 !important;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .stat-card {
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      box-shadow: var(--shadow-sm);
    }
    .stat-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
    }
    .stat-icon mat-icon {
      width: 22px;
      height: 22px;
      font-size: 22px;
    }
    .stat-body {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.4px;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 12px;
      opacity: .8;
      font-weight: 500;
    }
    .stat-card.total { background: linear-gradient(135deg, #4454d6, #3f46b6); }
    .stat-card.contract { background: linear-gradient(135deg, #0369a1, #075985); }
    .stat-card.collected { background: linear-gradient(135deg, #059669, #047857); }
    .stat-card.pending { background: linear-gradient(135deg, #b45309, #92400e); }
    .stat-card.overdue { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .stat-card.team { background: linear-gradient(135deg, #6d28d9, #5b21b6); }

    .toolbar-row {
      display: grid;
      grid-template-columns: 1fr minmax(300px, 420px);
      gap: 14px;
      margin-bottom: 14px;
      align-items: center;
    }
    .search-field {
      width: 100%;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 36px 20px;
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border);
      color: var(--text-muted);
    }
    .empty-state mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      margin-bottom: 8px;
    }
    .empty-state h3 {
      margin: 0 0 4px;
      color: var(--text-primary);
      font-size: 18px;
    }
    .empty-state p {
      margin: 0;
      font-size: 13px;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 14px;
    }
    .project-card {
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      padding: 16px;
    }

    .project-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
    }
    .project-head h3 {
      margin: 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    .project-head p {
      margin: 2px 0 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    .chips-wrap {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .chip {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: .3px;
    }
    .status-upcoming { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
    .status-running { background: rgba(16, 185, 129, 0.12); color: #047857; }
    .status-hold { background: rgba(245, 158, 11, 0.12); color: #b45309; }
    .status-completed { background: rgba(6, 182, 212, 0.12); color: #0e7490; }
    .status-cancelled { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
    .priority-high { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
    .priority-medium { background: rgba(245, 158, 11, 0.12); color: #b45309; }
    .priority-low { background: rgba(34, 197, 94, 0.12); color: #15803d; }
    .health-green { background: rgba(34, 197, 94, 0.12); color: #15803d; }
    .health-yellow { background: rgba(250, 204, 21, 0.15); color: #a16207; }
    .health-red { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }

    .progress-row {
      margin-bottom: 12px;
    }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      font-weight: 600;
    }
    .progress-track {
      height: 8px;
      border-radius: 999px;
      background: #e9edf8;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4361ee, #22c55e);
    }
    .date-range {
      margin-top: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .project-body-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 10px;
    }
    .info-block {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      background: #fff;
    }
    .info-block h4 {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--text-primary);
    }
    .kv {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }
    .kv strong {
      color: var(--text-primary);
      font-weight: 700;
    }
    .empty-text,
    .extra-text {
      font-size: 12px;
      color: var(--text-muted);
      margin: 4px 0;
    }

    .description {
      margin: 0 0 10px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 900px) {
      .toolbar-row {
        grid-template-columns: 1fr;
      }
      .projects-grid {
        grid-template-columns: 1fr;
      }
      .project-body-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 599px) {
      .page-intro {
        flex-direction: column;
        align-items: flex-start;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stat-card {
        padding: 12px;
      }
      .stat-value {
        font-size: 18px;
      }
    }
  `],
})
export class ProjectOpsComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  amountVis = inject(AmountVisibilityService);

  loading = true;
  selectedTabIndex = 0;
  selectedStatus: OpsProjectStatus | 'all' = 'upcoming';
  filterText = '';

  employees: Employee[] = [];
  allProjects: OpsProject[] = [];
  visibleProjects: OpsProject[] = [];

  summary: OpsSummary = {
    totalProjects: 0,
    totalContractValue: 0,
    totalCollected: 0,
    totalPending: 0,
    overduePayments: 0,
    activePeople: 0,
  };

  ngOnInit() {
    combineLatest([
      this.dataService.getOpsProjects(),
      this.dataService.getEmployees(),
    ]).subscribe(([projects, employees]) => {
      this.allProjects = projects;
      this.employees = employees;
      this.refreshView();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    if (event.index === 0) {
      this.selectedStatus = 'upcoming';
    } else if (event.index === 1) {
      this.selectedStatus = 'running';
    } else if (event.index === 2) {
      this.selectedStatus = 'on-hold';
    } else {
      this.selectedStatus = 'all';
    }
    this.refreshView();
  }

  onSearch(event: Event) {
    this.filterText = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.refreshView();
  }

  openDialog(project?: OpsProject) {
    this.dialog.open(ProjectOpsDialogComponent, {
      width: '920px',
      maxWidth: '98vw',
      maxHeight: '92vh',
      data: { project, employees: this.employees },
    }).afterClosed().subscribe(async (result: Partial<OpsProject> | undefined) => {
      if (!result) {
        return;
      }
      try {
        if (project) {
          await this.dataService.updateOpsProject(project.id, result);
          this.snackBar.open('Ops project updated', 'OK', { duration: 2200 });
        } else {
          await this.dataService.addOpsProject(result);
          this.snackBar.open('Ops project added', 'OK', { duration: 2200 });
        }
      } catch {
        this.snackBar.open('Error saving ops project', 'OK', { duration: 3200 });
      }
    });
  }

  async deleteProject(project: OpsProject) {
    if (!confirm(`Delete project ops record "${project.name}"?`)) {
      return;
    }

    try {
      await this.dataService.deleteOpsProject(project.id);
      this.snackBar.open('Ops project deleted', 'OK', { duration: 2200 });
    } catch {
      this.snackBar.open('Error deleting ops project', 'OK', { duration: 3200 });
    }
  }

  getCollected(project: OpsProject): number {
    const receivedDownPayments = (project.downPayments || []).filter((payment) => payment.received)
      .reduce((sum, payment) => sum + (payment.amountEGP || 0), 0);
    const receivedPayments = (project.projectPayments || []).filter((payment) => payment.received)
      .reduce((sum, payment) => sum + (payment.amountEGP || 0), 0);
    return receivedDownPayments + receivedPayments;
  }

  getPending(project: OpsProject): number {
    const pendingDownPayments = (project.downPayments || []).filter((payment) => !payment.received)
      .reduce((sum, payment) => sum + (payment.amountEGP || 0), 0);
    const pendingPayments = (project.projectPayments || []).filter((payment) => !payment.received)
      .reduce((sum, payment) => sum + (payment.amountEGP || 0), 0);
    return pendingDownPayments + pendingPayments;
  }

  getOverdueCount(project: OpsProject): number {
    const now = new Date();
    const allPayments = [...(project.downPayments || []), ...(project.projectPayments || [])];
    return allPayments.filter((payment) => !payment.received && payment.dueDate && new Date(payment.dueDate) < now).length;
  }

  getProgress(project: OpsProject): number {
    const total = project.milestones?.length || 0;
    if (!total) {
      return project.status === 'completed' ? 100 : 0;
    }
    const done = project.milestones.filter((milestone) => milestone.status === 'done').length;
    return Math.round((done / total) * 100);
  }

  doneMilestones(project: OpsProject): number {
    return (project.milestones || []).filter((milestone) => milestone.status === 'done').length;
  }

  blockedMilestones(project: OpsProject): number {
    return (project.milestones || []).filter((milestone) => milestone.status === 'blocked').length;
  }

  openRisks(project: OpsProject): number {
    return (project.risks || []).filter((risk) => risk.status !== 'closed').length;
  }

  topAssignments(assignments: OpsProjectAssignment[]): OpsProjectAssignment[] {
    return assignments.slice(0, 3);
  }

  estimateMonthlyCost(project: OpsProject): number {
    const employeeSalary = new Map(this.employees.map((employee) => [employee.id, employee.baseSalary || 0]));
    return (project.assignments || []).reduce((sum, assignment) => {
      const salary = employeeSalary.get(assignment.employeeId) || 0;
      return sum + (salary * (assignment.allocationPercent || 0)) / 100;
    }, 0);
  }

  private refreshView() {
    const byStatus = this.selectedStatus === 'all'
      ? [...this.allProjects]
      : this.allProjects.filter((project) => project.status === this.selectedStatus);

    if (!this.filterText) {
      this.visibleProjects = byStatus;
    } else {
      this.visibleProjects = byStatus.filter((project) =>
        project.name.toLowerCase().includes(this.filterText)
        || project.clientName.toLowerCase().includes(this.filterText)
        || (project.description || '').toLowerCase().includes(this.filterText)
        || (project.communicationNotes || '').toLowerCase().includes(this.filterText)
      );
    }

    this.summary = this.buildSummary(this.visibleProjects);
  }

  private buildSummary(projects: OpsProject[]): OpsSummary {
    const activePeopleIds = new Set<string>();
    for (const project of projects) {
      for (const assignment of project.assignments || []) {
        if (assignment.employeeId) {
          activePeopleIds.add(assignment.employeeId);
        }
      }
    }

    return {
      totalProjects: projects.length,
      totalContractValue: projects.reduce((sum, project) => sum + (project.contractValueEGP || 0), 0),
      totalCollected: projects.reduce((sum, project) => sum + this.getCollected(project), 0),
      totalPending: projects.reduce((sum, project) => sum + this.getPending(project), 0),
      overduePayments: projects.reduce((sum, project) => sum + this.getOverdueCount(project), 0),
      activePeople: activePeopleIds.size,
    };
  }
}
