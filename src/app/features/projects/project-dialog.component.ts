import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MainScope } from '../../core/models';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.project ? 'Edit Project' : 'Add Project' }}</h2>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project / Employer Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid" class="save-btn">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { padding: 4px 0 0; }
    .dialog-header h2 {
      font-size: 20px; font-weight: 700; letter-spacing: -0.3px;
      color: var(--text-primary);
    }
    .form-content { padding: 16px 0; }
    .full-width { width: 100%; }
    .save-btn { border-radius: 10px !important; font-weight: 600 !important; padding: 0 24px !important; }
    .cancel-btn { border-radius: 10px !important; }
  `],
})
export class ProjectDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectDialogComponent>);

  form = this.fb.group({
    name: ['', Validators.required],
    notes: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { project?: MainScope }) {
    if (data.project) {
      this.form.patchValue({
        name: data.project.name,
        notes: data.project.notes || '',
      });
    }
  }

  save() {
    this.dialogRef.close(this.form.value);
  }
}
