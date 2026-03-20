import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { Employee } from '../../core/models';

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Edit' : 'Add' }} Employee</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-col">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Position</mat-label>
          <input matInput formControlName="position" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Base Salary (EGP)</mat-label>
          <input matInput type="number" formControlName="baseSalary" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Weekend</mat-label>
          <input matInput formControlName="weekend" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="Instapay">Instapay</mat-option>
            <mat-option value="Vodafone Cash">Vodafone Cash</mat-option>
            <mat-option value="Bank Transfer">Bank Transfer</mat-option>
            <mat-option value="Cash">Cash</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Account Number</mat-label>
          <input matInput formControlName="accountNumber" />
        </mat-form-field>
        <mat-slide-toggle formControlName="isActive" color="primary">Active</mat-slide-toggle>
      </form>
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
export class EmployeeDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EmployeeDialogComponent>);

  form = this.fb.group({
    name: ['', Validators.required],
    position: [''],
    baseSalary: [0],
    weekend: [''],
    paymentMethod: ['Instapay'],
    accountNumber: [''],
    isActive: [true],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { item?: Employee }) {
    if (data.item) {
      this.form.patchValue(data.item);
    }
  }

  save() {
    this.dialogRef.close(this.form.value);
  }
}
