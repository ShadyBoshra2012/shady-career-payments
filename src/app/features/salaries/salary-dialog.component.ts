import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { Employee, PaymentAttachment, SalaryPayment } from '../../core/models';
import { AttachmentManagerComponent } from '../../shared/components/attachment-manager.component';

@Component({
  selector: 'app-salary-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatTabsModule,
    AttachmentManagerComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Edit' : 'Add' }} Salary Payment</h2>
    <mat-dialog-content>
      <mat-tab-group>
        <mat-tab label="Details">
          <form [formGroup]="form" class="form-col">
            <mat-form-field appearance="outline">
              <mat-label>Employee</mat-label>
              <mat-select formControlName="employeeId">
                @for (emp of data.employees; track emp.id) {
                  <mat-option [value]="emp.id">{{ emp.name }} - {{ emp.position }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker startView="year"></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Amount (EGP)</mat-label>
              <input matInput type="number" formControlName="amount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Comments</mat-label>
              <textarea matInput formControlName="comments" rows="2"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          </form>
        </mat-tab>
        <mat-tab label="Attachments">
          <div style="padding: 16px 0;">
            <app-attachment-manager
              [attachments]="attachments"
              folder="salaries"
              (attachmentsChange)="attachments = $event"
            ></app-attachment-manager>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-col { display: flex; flex-direction: column; gap: 4px; padding: 16px 0; }
  `],
})
export class SalaryDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SalaryDialogComponent>);
  attachments: PaymentAttachment[] = [];

  form = this.fb.group({
    employeeId: ['', Validators.required],
    date: [new Date(), Validators.required],
    amount: [0, Validators.required],
    comments: [''],
    notes: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { item?: SalaryPayment; employees: Employee[] }) {
    if (data.item) {
      this.form.patchValue({
        ...data.item,
        date: data.item.date ? new Date(data.item.date) : new Date(),
      });
      this.attachments = data.item.attachments || [];
    }
  }

  save() {
    const val = this.form.value;
    const emp = this.data.employees.find((e) => e.id === val.employeeId);
    this.dialogRef.close({ ...val, employeeName: emp?.name || '', attachments: this.attachments });
  }
}
