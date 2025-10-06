import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface Member {
  name: string;
  callsign: string;
  clubs: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RosterService {
  private members$?: Observable<Member[]>;

  constructor(private http: HttpClient) { }

  /**
   * Load members from unified JSON file
   * Filters out members without callsigns
   */
  getMembers(): Observable<Member[]> {
    if (!this.members$) {
      this.members$ = this.http.get<Member[]>('members.json').pipe(
        map(members => members.filter(member =>
          member.callsign && member.callsign.trim() !== ''
        )),
        catchError(error => {
          console.error('Error loading members roster:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.members$;
  }

  /**
   * Get roster (for backward compatibility)
   */
  getRoster(): Observable<{ members: Member[] }> {
    return this.getMembers().pipe(
      map(members => ({ members }))
    );
  }

  /**
   * Search members by partial callsign
   */
  searchByCallsign(searchTerm: string): Observable<Member[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      return of([]);
    }

    const search = searchTerm.toUpperCase().trim();

    return this.getMembers().pipe(
      map(members => {
        return members.filter(member =>
          member.callsign && member.callsign.toUpperCase().includes(search)
        );
      })
    );
  }

  /**
   * Search members by partial callsign or name
   */
  searchByCallsignOrName(searchTerm: string): Observable<Member[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      return of([]);
    }

    const search = searchTerm.toUpperCase().trim();

    return this.getMembers().pipe(
      map(members => {
        return members.filter(member => {
          const callsignMatch = member.callsign && member.callsign.toUpperCase().includes(search);
          const nameMatch = member.name && member.name.toUpperCase().includes(search);
          return callsignMatch || nameMatch;
        });
      })
    );
  }
}
