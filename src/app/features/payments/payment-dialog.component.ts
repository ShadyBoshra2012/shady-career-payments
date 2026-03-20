import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MainScope, Payment, PaymentAttachment } from '../../core/models';
import { AttachmentManagerComponent } from '../../shared/components/attachment-manager.component';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule,
    MatTabsModule, AttachmentManagerComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.payment ? 'Edit Payment' : 'Add Payment' }}</h2>
    <mat-dialog-content>
      <mat-tab-group>
        <mat-tab label="Details">
          <form [formGroup]="form" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Main Scope (Project)</mat-label>
              <mat-select formControlName="mainScopeName">
                @for (scope of data.mainScopes; track scope.id) {
                  <mat-option [value]="scope.name">{{ scope.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sub Scope</mat-label>
              <input matInput formControlName="subScope" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker startView="year"></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Received (EGP)</mat-label>
              <input matInput type="number" formControlName="receivedEGP" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Received (USD)</mat-label>
              <input matInput type="number" formControlName="receivedUSD" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mine (EGP)</mat-label>
              <input matInput type="number" formControlName="mineEGP" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mine (USD)</mat-label>
              <input matInput type="number" formControlName="mineUSD" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>God Amount</mat-label>
              <input matInput type="number" formControlName="godAmount" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          </form>
        </mat-tab>

        <mat-tab label="Others (Splits)">
          <div class="splits-section" formArrayName="others" [formGroup]="form">
            @for (split of othersArray.controls; track $index; let i = $index) {
              <div class="split-row" [formGroupName]="i">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="personName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Amount</mat-label>
                  <input matInput type="number" formControlName="amount" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="currency-field">
                  <mat-label>Currency</mat-label>
                  <mat-select formControlName="currency">
                    <mat-option value="EGP">EGP</mat-option>
                    <mat-option value="USD">USD</mat-option>
                  </mat-select>
                </mat-form-field>
                <button mat-icon-button color="warn" (click)="removeSplit(i)">
                  <mat-icon>remove_circle</mat-icon>
                </button>
              </div>
            }
            <button mat-stroked-button (click)="addSplit()">
              <mat-icon>add</mat-icon> Add Split
            </button>
          </div>
        </mat-tab>

        <mat-tab label="Attachments">
          <div class="attachment-tab">
            <app-attachment-manager
              [attachments]="attachments"
              folder="payments"
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
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 16px 0;
    }
    .full-width { grid-column: span 2; }
    .split-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .split-row mat-form-field { flex: 1; }
    .currency-field { max-width: 100px; }
    .splits-section, .attachment-tab { padding: 16px 0; }
    @media (max-width: 599px) {
      .form-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
      .split-row { flex-wrap: wrap; }
    }
  `],
})
export class PaymentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);

  attachments: PaymentAttachment[] = [];

  form = this.fb.group({
    mainScopeName: ['', Validators.required],
    subScope: ['', Validators.required],
    date: [new Date(), Validators.required],
    receivedEGP: [0],
    receivedUSD: [0],
    mineEGP: [0],
    mineUSD: [0],
    godAmount: [0],
    notes: [''],
    others: this.fb.array([]),
  });

  get othersArray(): FormArray {
    return this.form.get('others') as FormArray;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: { payment?: Payment; mainScopes: MainScope[] }) {
    if (data.payment) {
      this.form.patchValue({
        mainScopeName: data.payment.mainScopeName,
        subScope: data.payment.subScope,
        date: data.payment.date ? new Date(data.payment.date) : new Date(),
        receivedEGP: data.payment.receivedEGP,
        receivedUSD: data.payment.receivedUSD,
        mineEGP: data.payment.mineEGP,
        mineUSD: data.payment.mineUSD,
        godAmount: data.payment.godAmount,
        notes: data.payment.notes,
      });
      this.attachments = data.payment.attachments || [];
      if (data.payment.others?.length) {
        for (const split of data.payment.others) {
          this.othersArray.push(
            this.fb.group({
              personName: [split.personName],
              amount: [split.amount],
              currency: [split.currency || 'EGP'],
            })
          );
        }
      }
    }
  }

  addSplit() {
    this.othersArray.push(
      this.fb.group({ personName: [''], amount: [0], currency: ['EGP'] })
    );
  }

  removeSplit(index: number) {
    this.othersArray.removeAt(index);
  }

  save() {
    const val = this.form.value;
    const receivedEGP = val.receivedEGP || 0;
    const godAmount = val.godAmount || 0;
    const godPercentage = receivedEGP > 0 ? Math.round((godAmount / receivedEGP) * 10000) / 100 : 0;
    const mainScope = this.data.mainScopes.find((s) => s.name === val.mainScopeName);

    this.dialogRef.close({
      mainScopeId: mainScope?.id || '',
      mainScopeName: val.mainScopeName,
      subScope: val.subScope,
      date: val.date,
      receivedEGP: val.receivedEGP || 0,
      receivedUSD: val.receivedUSD || 0,
      mineEGP: val.mineEGP || 0,
      mineUSD: val.mineUSD || 0,
      godAmount,
      godPercentage,
      others: val.others || [],
      notes: val.notes || '',
      attachments: this.attachments,
    });
  }
}
