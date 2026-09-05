import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RosterService, Member } from '../../services/roster.service';
import { MemberKnowledgeService } from '../../services/member-knowledge.service';

@Component({
  selector: 'app-browse',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatCardModule,
    MatChipsModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss'
})
export class BrowseComponent implements OnInit {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  displayedColumns: string[] = ['callsign', 'firstName', 'lastName', 'clubs', 'doNotKnow'];

  // Club filters
  showAARC = true;
  showBARC = true;
  showPhotosEnabled = false;
  browseMode: 'all' | 'known' | 'unknown' = 'all';

  // Photo map: callsign -> file extension
  private photoMap: { [callsign: string]: string } = {};

  constructor(
    private rosterService: RosterService,
    private http: HttpClient,
    private memberKnowledgeService: MemberKnowledgeService
  ) {}

  ngOnInit(): void {
    // Load photo map
    this.http.get<{ [callsign: string]: string }>('photo-map.json').subscribe({
      next: (map) => {
        this.photoMap = map;
      },
      error: (error) => {
        console.error('Error loading photo map:', error);
      }
    });

    // Load members
    this.rosterService.getRoster().subscribe(roster => {
      this.members = roster.members;
      this.applyFilters();
    });
  }

  /**
   * Apply club filters to member list
   */
  applyFilters(): void {
    this.filteredMembers = this.members.filter(member => {
      const hasAARC = member.clubs.includes('AARC');
      const hasBARC = member.clubs.includes('BARC');
      const isKnown = this.isKnown(member.callsign);

      if (!this.showAARC && hasAARC && !hasBARC) return false;
      if (!this.showBARC && hasBARC && !hasAARC) return false;
      if (!this.showAARC && !this.showBARC) return false;
      if (this.browseMode === 'known' && !isKnown) return false;
      if (this.browseMode === 'unknown' && isKnown) return false;

      return true;
    });
  }

  /**
   * Handle sort changes
   */
  onSortChange(sort: Sort): void {
    const data = this.filteredMembers.slice();

    if (!sort.active || sort.direction === '') {
      this.filteredMembers = data;
      return;
    }

    this.filteredMembers = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';

      switch (sort.active) {
        case 'photo':
          return this.compare(a.callsign, b.callsign, isAsc);
        case 'callsign':
          return this.compare(a.callsign, b.callsign, isAsc);
        case 'firstName':
          return this.compare(this.getFirstName(a), this.getFirstName(b), isAsc);
        case 'lastName':
          return this.compare(this.getLastName(a), this.getLastName(b), isAsc);
        default:
          return 0;
      }
    });
  }

  /**
   * Extract first name from full name
   * Returns the longest word that appears first in the name
   */
  getFirstName(member: Member): string {
    const words = member.name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0];

    // Get unique word lengths, sorted descending
    const lengths = [...new Set(words.map(w => w.length))].sort((a, b) => b - a);

    // Get words with the two longest lengths
    const topLengths = lengths.slice(0, 2);
    const candidates = words.filter(w => topLengths.includes(w.length));

    // Return the first candidate (longest word appearing first)
    return candidates[0] || words[0];
  }

  /**
   * Extract last name from full name
   * Returns the longest word that appears last in the name
   */
  getLastName(member: Member): string {
    const words = member.name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0];

    // Get unique word lengths, sorted descending
    const lengths = [...new Set(words.map(w => w.length))].sort((a, b) => b - a);

    // Get words with the two longest lengths
    const topLengths = lengths.slice(0, 2);
    const candidates = words.filter(w => topLengths.includes(w.length));

    // Return the last candidate (longest word appearing last)
    return candidates[candidates.length - 1] || words[words.length - 1];
  }

  /**
   * Compare function for sorting
   */
  private compare(a: string, b: string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Update displayed columns when photo toggle changes
   */
  updateDisplayedColumns(): void {
    if (this.showPhotosEnabled) {
      this.displayedColumns = ['photo', 'callsign', 'firstName', 'lastName', 'clubs', 'doNotKnow'];
    } else {
      this.displayedColumns = ['callsign', 'firstName', 'lastName', 'clubs', 'doNotKnow'];
    }
  }

  setBrowseMode(mode: 'all' | 'known' | 'unknown'): void {
    this.browseMode = mode;
    this.applyFilters();
  }

  isKnown(callsign: string): boolean {
    return this.memberKnowledgeService.isKnown(callsign);
  }

  isUnknown(callsign: string): boolean {
    return !this.isKnown(callsign);
  }

  updateKnownState(callsign: string, unknown: boolean): void {
    this.memberKnowledgeService.setKnown(callsign, !unknown);
    this.applyFilters();
  }

  clearKnownMembers(): void {
    if (confirm('Clear all saved known members?')) {
      this.memberKnowledgeService.clearKnown();
      this.applyFilters();
    }
  }

  /**
   * Check if a photo exists for a callsign
   */
  hasPhoto(callsign: string): boolean {
    return !!this.photoMap[callsign?.toUpperCase()];
  }

  /**
   * Get photo URL for a callsign
   */
  getPhotoUrl(callsign: string): string {
    const extension = this.photoMap[callsign?.toUpperCase()];
    if (extension) {
      return `pictures/${callsign}.${extension}`;
    }
    return '';
  }
}
