import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  Employee,
  OpsProject,
  OpsProjectAssignment,
  OpsProjectHealth,
  OpsProjectMilestone,
  OpsProjectPayment,
  OpsProjectPriority,
  OpsProjectRisk,
  OpsProjectStatus,
} from '../../core/models';

@Component({
  selector: 'app-project-ops-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.project ? 'Edit Project Ops' : 'Add Project Ops' }}</h2>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-root">
        <mat-tab-group>
          <mat-tab label="Details">
            <div class="tab-grid">
              <mat-form-field appearance="outline">
                <mat-label>Project Name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Client Name</mat-label>
                <input matInput formControlName="clientName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  @for (status of statusOptions; track status) {
                    <mat-option [value]="status">{{ status }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Priority</mat-label>
                <mat-select formControlName="priority">
                  @for (priority of priorityOptions; track priority) {
                    <mat-option [value]="priority">{{ priority }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Health</mat-label>
                <mat-select formControlName="health">
                  @for (health of healthOptions; track health) {
                    <mat-option [value]="health">{{ health }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contract Value (EGP)</mat-label>
                <input matInput type="number" formControlName="contractValueEGP" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Expected End Date</mat-label>
                <input matInput [matDatepicker]="expectedEndPicker" formControlName="expectedEndDate" />
                <mat-datepicker-toggle matSuffix [for]="expectedEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #expectedEndPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Actual End Date</mat-label>
                <input matInput [matDatepicker]="actualEndPicker" formControlName="actualEndDate" />
                <mat-datepicker-toggle matSuffix [for]="actualEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #actualEndPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-span">
                <mat-label>Description</mat-label>
                <textarea matInput rows="3" formControlName="description"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-span">
                <mat-label>Communication Notes</mat-label>
                <textarea matInput rows="3" formControlName="communicationNotes"></textarea>
              </mat-form-field>
            </div>
          </mat-tab>

          <mat-tab label="Down Payments">
            <div class="tab-block">
              <div class="block-actions">
                <button mat-stroked-button type="button" (click)="addDownPayment()">
                  <mat-icon>add</mat-icon>
                  Add Down Payment
                </button>
              </div>

              @for (group of downPaymentControls; track $index; let i = $index) {
                <div class="entry-card" [formGroup]="group">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Title</mat-label>
                      <input matInput formControlName="title" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Amount (EGP)</mat-label>
                      <input matInput type="number" formControlName="amountEGP" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Due Date</mat-label>
                      <input matInput [matDatepicker]="dpDuePicker" formControlName="dueDate" />
                      <mat-datepicker-toggle matSuffix [for]="dpDuePicker"></mat-datepicker-toggle>
                      <mat-datepicker #dpDuePicker></mat-datepicker>
                    </mat-form-field>
                    <mat-checkbox formControlName="received" class="checkbox-field">Received</mat-checkbox>
                    <mat-form-field appearance="outline">
                      <mat-label>Received Date</mat-label>
                      <input matInput [matDatepicker]="dpReceivedPicker" formControlName="receivedDate" />
                      <mat-datepicker-toggle matSuffix [for]="dpReceivedPicker"></mat-datepicker-toggle>
                      <mat-datepicker #dpReceivedPicker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-span">
                      <mat-label>Notes</mat-label>
                      <input matInput formControlName="notes" />
                    </mat-form-field>
                  </div>
                  <button mat-icon-button color="warn" type="button" (click)="removeDownPayment(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Project Payments">
            <div class="tab-block">
              <div class="block-actions">
                <button mat-stroked-button type="button" (click)="addProjectPayment()">
                  <mat-icon>add</mat-icon>
                  Add Payment
                </button>
              </div>

              @for (group of projectPaymentControls; track $index; let i = $index) {
                <div class="entry-card" [formGroup]="group">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Title</mat-label>
                      <input matInput formControlName="title" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Amount (EGP)</mat-label>
                      <input matInput type="number" formControlName="amountEGP" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Due Date</mat-label>
                      <input matInput [matDatepicker]="ppDuePicker" formControlName="dueDate" />
                      <mat-datepicker-toggle matSuffix [for]="ppDuePicker"></mat-datepicker-toggle>
                      <mat-datepicker #ppDuePicker></mat-datepicker>
                    </mat-form-field>
                    <mat-checkbox formControlName="received" class="checkbox-field">Received</mat-checkbox>
                    <mat-form-field appearance="outline">
                      <mat-label>Received Date</mat-label>
                      <input matInput [matDatepicker]="ppReceivedPicker" formControlName="receivedDate" />
                      <mat-datepicker-toggle matSuffix [for]="ppReceivedPicker"></mat-datepicker-toggle>
                      <mat-datepicker #ppReceivedPicker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-span">
                      <mat-label>Notes</mat-label>
                      <input matInput formControlName="notes" />
                    </mat-form-field>
                  </div>
                  <button mat-icon-button color="warn" type="button" (click)="removeProjectPayment(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Timeline">
            <div class="tab-block">
              <div class="block-actions">
                <button mat-stroked-button type="button" (click)="addMilestone()">
                  <mat-icon>add</mat-icon>
                  Add Milestone
                </button>
              </div>

              @for (group of milestoneControls; track $index; let i = $index) {
                <div class="entry-card" [formGroup]="group">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Milestone</mat-label>
                      <input matInput formControlName="title" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Due Date</mat-label>
                      <input matInput [matDatepicker]="msDuePicker" formControlName="dueDate" />
                      <mat-datepicker-toggle matSuffix [for]="msDuePicker"></mat-datepicker-toggle>
                      <mat-datepicker #msDuePicker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select formControlName="status">
                        @for (status of milestoneStatusOptions; track status) {
                          <mat-option [value]="status">{{ status }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Owner</mat-label>
                      <mat-select formControlName="ownerEmployeeId">
                        <mat-option value="">None</mat-option>
                        @for (employee of data.employees; track employee.id) {
                          <mat-option [value]="employee.id">{{ employee.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-span">
                      <mat-label>Notes</mat-label>
                      <input matInput formControlName="notes" />
                    </mat-form-field>
                  </div>
                  <button mat-icon-button color="warn" type="button" (click)="removeMilestone(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Team">
            <div class="tab-block">
              <div class="block-actions">
                <button mat-stroked-button type="button" (click)="addAssignment()">
                  <mat-icon>add</mat-icon>
                  Assign Team Member
                </button>
              </div>

              @for (group of assignmentControls; track $index; let i = $index) {
                <div class="entry-card" [formGroup]="group">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Employee</mat-label>
                      <mat-select formControlName="employeeId">
                        @for (employee of data.employees; track employee.id) {
                          <mat-option [value]="employee.id">{{ employee.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Role</mat-label>
                      <input matInput formControlName="role" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Allocation %</mat-label>
                      <input matInput type="number" formControlName="allocationPercent" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput [matDatepicker]="assStartPicker" formControlName="startDate" />
                      <mat-datepicker-toggle matSuffix [for]="assStartPicker"></mat-datepicker-toggle>
                      <mat-datepicker #assStartPicker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput [matDatepicker]="assEndPicker" formControlName="endDate" />
                      <mat-datepicker-toggle matSuffix [for]="assEndPicker"></mat-datepicker-toggle>
                      <mat-datepicker #assEndPicker></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-span">
                      <mat-label>Notes</mat-label>
                      <input matInput formControlName="notes" />
                    </mat-form-field>
                  </div>
                  <button mat-icon-button color="warn" type="button" (click)="removeAssignment(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Risks">
            <div class="tab-block">
              <div class="block-actions">
                <button mat-stroked-button type="button" (click)="addRisk()">
                  <mat-icon>add</mat-icon>
                  Add Risk
                </button>
              </div>

              @for (group of riskControls; track $index; let i = $index) {
                <div class="entry-card" [formGroup]="group">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Risk Title</mat-label>
                      <input matInput formControlName="title" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Impact</mat-label>
                      <mat-select formControlName="impact">
                        @for (impact of riskImpactOptions; track impact) {
                          <mat-option [value]="impact">{{ impact }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select formControlName="status">
                        @for (status of riskStatusOptions; track status) {
                          <mat-option [value]="status">{{ status }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Owner</mat-label>
                      <mat-select formControlName="ownerEmployeeId">
                        <mat-option value="">None</mat-option>
                        @for (employee of data.employees; track employee.id) {
                          <mat-option [value]="employee.id">{{ employee.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-span">
                      <mat-label>Mitigation</mat-label>
                      <input matInput formControlName="mitigation" />
                    </mat-form-field>
                  </div>
                  <button mat-icon-button color="warn" type="button" (click)="removeRisk(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid" class="save-btn">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header h2 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: var(--text-primary);
    }
    .form-root {
      padding-top: 8px;
      min-width: 760px;
      max-width: 100%;
    }
    .tab-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding: 16px 2px;
    }
    .full-span {
      grid-column: 1 / -1;
    }
    .tab-block {
      padding: 14px 2px;
    }
    .block-actions {
      margin-bottom: 12px;
      display: flex;
      justify-content: flex-end;
    }
    .entry-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 10px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      background: #fff;
    }
    .entry-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .checkbox-field {
      align-self: center;
      margin-top: 4px;
    }
    .save-btn {
      border-radius: 10px !important;
      font-weight: 600 !important;
      padding: 0 24px !important;
    }
    .cancel-btn {
      border-radius: 10px !important;
    }

    @media (max-width: 900px) {
      .form-root {
        min-width: 0;
      }
      .tab-grid,
      .entry-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ProjectOpsDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectOpsDialogComponent>);

  statusOptions: OpsProjectStatus[] = ['upcoming', 'running', 'on-hold', 'completed', 'cancelled'];
  priorityOptions: OpsProjectPriority[] = ['low', 'medium', 'high'];
  healthOptions: OpsProjectHealth[] = ['green', 'yellow', 'red'];
  milestoneStatusOptions = ['not-started', 'in-progress', 'done', 'blocked'] as const;
  riskImpactOptions = ['low', 'medium', 'high'] as const;
  riskStatusOptions = ['open', 'monitoring', 'closed'] as const;

  form = this.fb.group({
    name: ['', Validators.required],
    clientName: ['', Validators.required],
    status: ['upcoming' as OpsProjectStatus, Validators.required],
    priority: ['medium' as OpsProjectPriority, Validators.required],
    health: ['green' as OpsProjectHealth, Validators.required],
    startDate: [new Date(), Validators.required],
    expectedEndDate: [new Date(), Validators.required],
    actualEndDate: [null as Date | null],
    contractValueEGP: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    communicationNotes: [''],
    downPayments: this.fb.array([]),
    projectPayments: this.fb.array([]),
    milestones: this.fb.array([]),
    assignments: this.fb.array([]),
    risks: this.fb.array([]),
  });

  get downPayments(): FormArray {
    return this.form.get('downPayments') as FormArray;
  }

  get downPaymentControls(): FormGroup[] {
    return this.downPayments.controls as FormGroup[];
  }

  get projectPayments(): FormArray {
    return this.form.get('projectPayments') as FormArray;
  }

  get projectPaymentControls(): FormGroup[] {
    return this.projectPayments.controls as FormGroup[];
  }

  get milestones(): FormArray {
    return this.form.get('milestones') as FormArray;
  }

  get milestoneControls(): FormGroup[] {
    return this.milestones.controls as FormGroup[];
  }

  get assignments(): FormArray {
    return this.form.get('assignments') as FormArray;
  }

  get assignmentControls(): FormGroup[] {
    return this.assignments.controls as FormGroup[];
  }

  get risks(): FormArray {
    return this.form.get('risks') as FormArray;
  }

  get riskControls(): FormGroup[] {
    return this.risks.controls as FormGroup[];
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: { project?: OpsProject; employees: Employee[] }) {
    if (!data.project) {
      return;
    }

    this.form.patchValue({
      name: data.project.name,
      clientName: data.project.clientName,
      status: data.project.status,
      priority: data.project.priority,
      health: data.project.health,
      startDate: data.project.startDate ? new Date(data.project.startDate) : new Date(),
      expectedEndDate: data.project.expectedEndDate ? new Date(data.project.expectedEndDate) : new Date(),
      actualEndDate: data.project.actualEndDate ? new Date(data.project.actualEndDate) : null,
      contractValueEGP: data.project.contractValueEGP,
      description: data.project.description || '',
      communicationNotes: data.project.communicationNotes || '',
    });

    for (const item of data.project.downPayments || []) {
      this.downPayments.push(this.createPaymentGroup(item));
    }
    for (const item of data.project.projectPayments || []) {
      this.projectPayments.push(this.createPaymentGroup(item));
    }
    for (const item of data.project.milestones || []) {
      this.milestones.push(this.createMilestoneGroup(item));
    }
    for (const item of data.project.assignments || []) {
      this.assignments.push(this.createAssignmentGroup(item));
    }
    for (const item of data.project.risks || []) {
      this.risks.push(this.createRiskGroup(item));
    }
  }

  addDownPayment() {
    this.downPayments.push(this.createPaymentGroup());
  }

  removeDownPayment(index: number) {
    this.downPayments.removeAt(index);
  }

  addProjectPayment() {
    this.projectPayments.push(this.createPaymentGroup());
  }

  removeProjectPayment(index: number) {
    this.projectPayments.removeAt(index);
  }

  addMilestone() {
    this.milestones.push(this.createMilestoneGroup());
  }

  removeMilestone(index: number) {
    this.milestones.removeAt(index);
  }

  addAssignment() {
    this.assignments.push(this.createAssignmentGroup());
  }

  removeAssignment(index: number) {
    this.assignments.removeAt(index);
  }

  addRisk() {
    this.risks.push(this.createRiskGroup());
  }

  removeRisk(index: number) {
    this.risks.removeAt(index);
  }

  save() {
    const raw = this.form.getRawValue();
    const employeesById = new Map(this.data.employees.map((employee) => [employee.id, employee]));

    const value: Partial<OpsProject> = {
      name: String(raw.name || '').trim(),
      clientName: String(raw.clientName || '').trim(),
      status: raw.status as OpsProjectStatus,
      priority: raw.priority as OpsProjectPriority,
      health: raw.health as OpsProjectHealth,
      startDate: this.toDate(raw.startDate) || new Date(),
      expectedEndDate: this.toDate(raw.expectedEndDate) || new Date(),
      actualEndDate: this.toDate(raw.actualEndDate),
      contractValueEGP: Number(raw.contractValueEGP || 0),
      description: String(raw.description || '').trim(),
      communicationNotes: String(raw.communicationNotes || '').trim(),
      downPayments: ((raw.downPayments || []) as Array<Record<string, unknown>>).map((item) => this.toPayment(item)),
      projectPayments: ((raw.projectPayments || []) as Array<Record<string, unknown>>).map((item) => this.toPayment(item)),
      milestones: ((raw.milestones || []) as Array<Record<string, unknown>>).map((item) => this.toMilestone(item)),
      assignments: ((raw.assignments || []) as Array<Record<string, unknown>>).map((item) => {
        const employeeId = String(item['employeeId'] || '');
        const employee = employeesById.get(employeeId);
        return {
          employeeId,
          employeeName: employee?.name || '',
          role: String(item['role'] || '').trim(),
          allocationPercent: Number(item['allocationPercent'] || 0),
          startDate: this.toDate(item['startDate']),
          endDate: this.toDate(item['endDate']),
          notes: String(item['notes'] || '').trim(),
        } as OpsProjectAssignment;
      }),
      risks: ((raw.risks || []) as Array<Record<string, unknown>>).map((item) => ({
        title: String(item['title'] || '').trim(),
        impact: item['impact'],
        ownerEmployeeId: String(item['ownerEmployeeId'] || '').trim(),
        mitigation: String(item['mitigation'] || '').trim(),
        status: item['status'],
      })) as OpsProjectRisk[],
    };

    this.dialogRef.close(value);
  }

  private createPaymentGroup(value?: OpsProjectPayment) {
    return this.fb.group({
      title: [value?.title || '', Validators.required],
      amountEGP: [value?.amountEGP || 0, [Validators.required, Validators.min(0)]],
      dueDate: [value?.dueDate ? new Date(value.dueDate) : new Date(), Validators.required],
      received: [Boolean(value?.received)],
      receivedDate: [value?.receivedDate ? new Date(value.receivedDate) : null],
      notes: [value?.notes || ''],
    });
  }

  private createMilestoneGroup(value?: OpsProjectMilestone) {
    return this.fb.group({
      title: [value?.title || '', Validators.required],
      dueDate: [value?.dueDate ? new Date(value.dueDate) : new Date(), Validators.required],
      status: [value?.status || 'not-started', Validators.required],
      ownerEmployeeId: [value?.ownerEmployeeId || ''],
      notes: [value?.notes || ''],
    });
  }

  private createAssignmentGroup(value?: OpsProjectAssignment) {
    return this.fb.group({
      employeeId: [value?.employeeId || '', Validators.required],
      role: [value?.role || '', Validators.required],
      allocationPercent: [value?.allocationPercent || 100, [Validators.required, Validators.min(1), Validators.max(100)]],
      startDate: [value?.startDate ? new Date(value.startDate) : null],
      endDate: [value?.endDate ? new Date(value.endDate) : null],
      notes: [value?.notes || ''],
    });
  }

  private createRiskGroup(value?: OpsProjectRisk) {
    return this.fb.group({
      title: [value?.title || '', Validators.required],
      impact: [value?.impact || 'medium', Validators.required],
      ownerEmployeeId: [value?.ownerEmployeeId || ''],
      mitigation: [value?.mitigation || ''],
      status: [value?.status || 'open', Validators.required],
    });
  }

  private toPayment(item: any): OpsProjectPayment {
    return {
      title: String(item.title || '').trim(),
      amountEGP: Number(item.amountEGP || 0),
      dueDate: this.toDate(item.dueDate) || new Date(),
      received: Boolean(item.received),
      receivedDate: this.toDate(item.receivedDate),
      notes: String(item.notes || '').trim(),
    };
  }

  private toMilestone(item: any): OpsProjectMilestone {
    return {
      title: String(item.title || '').trim(),
      dueDate: this.toDate(item.dueDate) || new Date(),
      status: item.status,
      ownerEmployeeId: String(item.ownerEmployeeId || '').trim(),
      notes: String(item.notes || '').trim(),
    };
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }
    const date = new Date(value as Date);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  }
}
