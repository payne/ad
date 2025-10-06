import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AttendanceRecord {
  callsign: string;
  name: string;
  timestamp: Date;
  clubs: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly STORAGE_KEY = 'attendance_records';
  private attendanceSubject = new BehaviorSubject<AttendanceRecord[]>(this.loadFromStorage());

  constructor() { }

  /**
   * Get observable of attendance records
   */
  getAttendance(): Observable<AttendanceRecord[]> {
    return this.attendanceSubject.asObservable();
  }

  /**
   * Get current attendance records
   */
  getCurrentAttendance(): AttendanceRecord[] {
    return this.attendanceSubject.value;
  }

  /**
   * Record attendance for a member
   */
  recordAttendance(callsign: string, name: string, clubs: string[] = []): void {
    const records = this.getCurrentAttendance();

    // Check if already recorded today
    const alreadyRecorded = records.find(r => r.callsign === callsign);

    if (!alreadyRecorded) {
      const newRecord: AttendanceRecord = {
        callsign,
        name,
        timestamp: new Date(),
        clubs
      };

      const updatedRecords = [...records, newRecord];
      this.saveToStorage(updatedRecords);
      this.attendanceSubject.next(updatedRecords);
    }
  }

  /**
   * Remove an attendance record
   */
  removeAttendance(callsign: string): void {
    const records = this.getCurrentAttendance();
    const updatedRecords = records.filter(r => r.callsign !== callsign);
    this.saveToStorage(updatedRecords);
    this.attendanceSubject.next(updatedRecords);
  }

  /**
   * Clear all attendance records
   */
  clearAttendance(): void {
    this.saveToStorage([]);
    this.attendanceSubject.next([]);
  }

  /**
   * Check if member has already been recorded
   */
  isRecorded(callsign: string): boolean {
    return this.getCurrentAttendance().some(r => r.callsign === callsign);
  }

  /**
   * Get count of attendees
   */
  getAttendanceCount(): number {
    return this.getCurrentAttendance().length;
  }

  /**
   * Load attendance from localStorage
   */
  private loadFromStorage(): AttendanceRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects and ensure clubs array exists
        return parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
          clubs: record.clubs || []
        }));
      }
    } catch (error) {
      console.error('Error loading attendance from storage:', error);
    }
    return [];
  }

  /**
   * Save attendance to localStorage
   */
  private saveToStorage(records: AttendanceRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving attendance to storage:', error);
    }
  }
}
