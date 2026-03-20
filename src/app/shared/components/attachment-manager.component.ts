import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { StorageService } from '../../core/services/storage.service';
import { PaymentAttachment } from '../../core/models';

@Component({
  selector: 'app-attachment-manager',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatChipsModule],
  template: `
    <div class="attachments-section">
      <div class="upload-area">
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          hidden
        />
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploading">
          <mat-icon>attach_file</mat-icon>
          Add Files
        </button>
        @if (uploading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </div>
      @if (attachments.length) {
        <div class="attachment-list">
          @for (att of attachments; track att.id) {
            <div class="attachment-item">
              @if (isImage(att)) {
                <img [src]="att.url" [alt]="att.name" class="thumb" (click)="openUrl(att.url)" />
              } @else {
                <mat-icon class="file-icon" (click)="openUrl(att.url)">description</mat-icon>
              }
              <span class="att-name" (click)="openUrl(att.url)">{{ att.name }}</span>
              <button mat-icon-button color="warn" (click)="removeAttachment(att)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-area { margin-bottom: 12px; }
    .upload-area button { border-radius: 10px !important; }
    .attachment-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .attachment-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; background: var(--surface); border-radius: 12px;
      border: 1px solid var(--border); transition: box-shadow 0.2s;
    }
    .attachment-item:hover { box-shadow: var(--shadow-sm); }
    .thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; cursor: pointer; }
    .file-icon { cursor: pointer; color: var(--text-muted); }
    .att-name { font-size: 13px; cursor: pointer; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); font-weight: 500; }
  `],
})
export class AttachmentManagerComponent {
  @Input() attachments: PaymentAttachment[] = [];
  @Input() folder = 'attachments';
  @Output() attachmentsChange = new EventEmitter<PaymentAttachment[]>();

  private storageService = inject(StorageService);
  uploading = false;

  isImage(att: PaymentAttachment): boolean {
    return att.type?.startsWith('image/') ?? false;
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploading = true;
    try {
      for (const file of Array.from(input.files)) {
        const att = await this.storageService.uploadFile(file, this.folder);
        this.attachments = [...this.attachments, att];
      }
      this.attachmentsChange.emit(this.attachments);
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  async removeAttachment(att: PaymentAttachment) {
    await this.storageService.deleteFile(att, this.folder);
    this.attachments = this.attachments.filter((a) => a.id !== att.id);
    this.attachmentsChange.emit(this.attachments);
  }
}
