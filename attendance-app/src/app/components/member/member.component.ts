import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AttendanceRecord } from '../../services/attendance.service';

@Component({
  selector: 'app-member',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './member.component.html',
  styleUrl: './member.component.scss'
})
export class MemberComponent {
  @Input() record!: AttendanceRecord;
  @Input() showPhotosEnabled = false;
  @Output() remove = new EventEmitter<string>();

  // Track which photo extensions have been tried for each callsign
  private photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  private photoExtensionIndex: { [callsign: string]: number } = {};

  /**
   * Get photo URL for a callsign
   */
  getPhotoUrl(callsign: string): string {
    // Initialize extension index for this callsign if not already set
    if (this.photoExtensionIndex[callsign] === undefined) {
      this.photoExtensionIndex[callsign] = 0;
    }

    const extension = this.photoExtensions[this.photoExtensionIndex[callsign]];
    return `pictures/${callsign}.${extension}`;
  }

  /**
   * Handle image load error by trying next extension
   */
  handleImageError(event: Event, callsign: string): void {
    const img = event.target as HTMLImageElement;

    // Try next extension
    if (this.photoExtensionIndex[callsign] < this.photoExtensions.length - 1) {
      this.photoExtensionIndex[callsign]++;
      const extension = this.photoExtensions[this.photoExtensionIndex[callsign]];
      img.src = `pictures/${callsign}.${extension}`;
    } else {
      // No more extensions to try, hide the image
      img.style.display = 'none';
    }
  }

  /**
   * Emit remove event
   */
  onRemove(): void {
    this.remove.emit(this.record.callsign);
  }
}
