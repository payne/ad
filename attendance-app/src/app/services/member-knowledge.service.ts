import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MemberKnowledgeService {
  private readonly STORAGE_KEY = 'known_member_callsigns';
  private knownCallsigns = new Set<string>(this.loadFromStorage());

  isKnown(callsign: string): boolean {
    return this.knownCallsigns.has(this.normalizeCallsign(callsign));
  }

  setKnown(callsign: string, known: boolean): void {
    const normalizedCallsign = this.normalizeCallsign(callsign);

    if (!normalizedCallsign) {
      return;
    }

    if (known) {
      this.knownCallsigns.add(normalizedCallsign);
    } else {
      this.knownCallsigns.delete(normalizedCallsign);
    }

    this.saveToStorage();
  }

  clearKnown(): void {
    this.knownCallsigns.clear();
    this.saveToStorage();
  }

  private loadFromStorage(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(callsign => this.normalizeCallsign(callsign))
        .filter((callsign): callsign is string => !!callsign);
    } catch (error) {
      console.error('Error loading known members from storage:', error);
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...this.knownCallsigns]));
    } catch (error) {
      console.error('Error saving known members to storage:', error);
    }
  }

  private normalizeCallsign(callsign: string): string {
    return callsign?.trim().toUpperCase() || '';
  }
}
