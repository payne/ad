import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RosterService, Member } from '../../services/roster.service';
import { AttendanceService, AttendanceRecord } from '../../services/attendance.service';
import { MemberKnowledgeService } from '../../services/member-knowledge.service';
import { MemberComponent } from '../member/member.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatBadgeModule,
    MatMenuModule,
    MatSlideToggleModule,
    MemberComponent
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  searchTerm = '';
  matchedMembers: Member[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  clubName = '';
  searchByNameEnabled = false;
  showPhotosEnabled = false;
  memberVisibility: 'all' | 'known' | 'unknown' = 'all';

  // Track which photo extensions have been tried for each callsign
  private photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  private photoExtensionIndex: { [callsign: string]: number } = {};

  constructor(
    private rosterService: RosterService,
    private attendanceService: AttendanceService,
    private http: HttpClient,
    private memberKnowledgeService: MemberKnowledgeService
  ) { }

  ngOnInit(): void {
    // Load attendance records
    this.attendanceService.getAttendance().subscribe(records => {
      this.attendanceRecords = records;
    });

    // Load club name
    this.rosterService.getRoster().subscribe(roster => {
      this.clubName = "AARC & BARC People";
    });
  }

  /**
   * Search for members as user types
   */
  onSearchChange(): void {
    if (this.searchTerm.trim() === '') {
      this.matchedMembers = [];
      return;
    }

    const searchMethod = this.searchByNameEnabled
      ? this.rosterService.searchByCallsignOrName(this.searchTerm)
      : this.rosterService.searchByCallsign(this.searchTerm);

    searchMethod.subscribe(members => {
      this.matchedMembers = this.filterMembersByVisibility(members);
    });
  }

  /**
   * Handle Enter key press
   */
  onEnter(): void {
    const term = this.searchTerm.trim().toUpperCase();
    if (!term) return;

    // Check if we have an exact match locally
    const localMatch = this.matchedMembers.find(m => m.callsign.toUpperCase() === term);
    if (localMatch) {
      return;
    }

    // Call external API
    this.http.get<any>(`https://callook.info/${term}/json`).subscribe({
      next: (data) => {
        if (data.status === 'VALID') {
          const newMember: Member = {
            name: data.name,
            callsign: data.current.callsign,
            clubs: []
          };
          if (!this.shouldShowMember(newMember)) {
            return;
          }
          // Check if it's already in matchedMembers to avoid duplicates
          if (!this.matchedMembers.some(m => m.callsign === newMember.callsign)) {
            this.matchedMembers.push(newMember);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching callsign info:', err);
      }
    });
  }

  /**
   * Record attendance when a callsign is clicked
   */
  recordAttendance(member: Member): void {
    this.attendanceService.recordAttendance(member.callsign, member.name, member.clubs);

    // Clear search
    this.searchTerm = '';
    this.matchedMembers = [];

    // Focus back on input for quick entry
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  /**
   * Remove attendance record
   */
  removeAttendance(callsign: string): void {
    this.attendanceService.removeAttendance(callsign);
  }

  /**
   * Clear all attendance
   */
  clearAllAttendance(): void {
    if (confirm('Clear all attendance records?')) {
      this.attendanceService.clearAttendance();
    }
  }

  /**
   * Check if member is already recorded
   */
  isRecorded(callsign: string): boolean {
    return this.attendanceService.isRecorded(callsign);
  }

  /**
   * Get attendance count
   */
  get attendanceCount(): number {
    return this.attendanceRecords.length;
  }

  setMemberVisibility(mode: 'all' | 'known' | 'unknown'): void {
    this.memberVisibility = mode;
    this.onSearchChange();
  }

  /**
   * Download attendance records as JSON
   */
  downloadAttendanceJSON(): void {
    const data = {
      club_name: this.clubName,
      download_date: new Date().toISOString(),
      attendance_count: this.attendanceRecords.length,
      records: this.attendanceRecords
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Create filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `attendance-${dateStr}.json`;

    link.click();
    window.URL.revokeObjectURL(url);
  }

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

  private filterMembersByVisibility(members: Member[]): Member[] {
    return members.filter(member => this.shouldShowMember(member));
  }

  private shouldShowMember(member: Member): boolean {
    const isKnown = this.memberKnowledgeService.isKnown(member.callsign);

    if (this.memberVisibility === 'known') {
      return isKnown;
    }

    if (this.memberVisibility === 'unknown') {
      return !isKnown;
    }

    return true;
  }
}
