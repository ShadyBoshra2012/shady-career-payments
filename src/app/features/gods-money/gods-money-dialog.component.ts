import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { GodsMoney, PaymentAttachment } from '../../core/models';
import { AttachmentManagerComponent } from '../../shared/components/attachment-manager.component';

@Component({
  selector: 'app-gods-money-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatTabsModule,
    AttachmentManagerComponent,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.item ? 'Edit' : 'Add' }} God's Money Disbursement</h2>
    </div>
    <mat-dialog-content>
      <mat-tab-group>
        <mat-tab label="Details">
          <form [formGroup]="form" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Responsible To</mat-label>
              <input matInput formControlName="responsibleTo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Amount (EGP)</mat-label>
              <input matInput type="number" formControlName="priceEGP" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Proof</mat-label>
              <input matInput formControlName="proof" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sending Date</mat-label>
              <input matInput [matDatepicker]="sendPicker" formControlName="sendingDate" />
              <mat-datepicker-toggle matSuffix [for]="sendPicker"></mat-datepicker-toggle>
              <mat-datepicker #sendPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Execution Date</mat-label>
              <input matInput [matDatepicker]="execPicker" formControlName="executionDate" />
              <mat-datepicker-toggle matSuffix [for]="execPicker"></mat-datepicker-toggle>
              <mat-datepicker #execPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          </form>
        </mat-tab>
        <mat-tab label="Attachments">
          <div style="padding: 16px 0;">
            <app-attachment-manager
              [attachments]="attachments"
              folder="gods-money"
              (attachmentsChange)="attachments = $event"
            ></app-attachment-manager>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid" class="save-btn">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; color: var(--text-primary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px 0; }
    .full-width { grid-column: span 2; }
    .save-btn { border-radius: 10px !important; font-weight: 600 !important; padding: 0 24px !important; }
    .cancel-btn { border-radius: 10px !important; }
    @media (max-width: 599px) { .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }
  `],
})
export class GodsMoneyDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GodsMoneyDialogComponent>);
  attachments: PaymentAttachment[] = [];

  form = this.fb.group({
    responsibleTo: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    priceEGP: [0, Validators.required],
    proof: [''],
    sendingDate: [new Date()],
    executionDate: [new Date()],
    notes: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { item?: GodsMoney }) {
    if (data.item) {
      this.form.patchValue({
        ...data.item,
        sendingDate: data.item.sendingDate ? new Date(data.item.sendingDate) : new Date(),
        executionDate: data.item.executionDate ? new Date(data.item.executionDate) : new Date(),
      });
      this.attachments = data.item.attachments || [];
    }
  }

  save() {
    this.dialogRef.close({ ...this.form.value, attachments: this.attachments });
  }
}
