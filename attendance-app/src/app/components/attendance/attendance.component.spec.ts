import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AttendanceComponent } from './attendance.component';
import { RosterService } from '../../services/roster.service';
import { AttendanceService } from '../../services/attendance.service';
import { MemberKnowledgeService } from '../../services/member-knowledge.service';

describe('AttendanceComponent', () => {
  let component: AttendanceComponent;
  let fixture: ComponentFixture<AttendanceComponent>;
  let rosterService: jasmine.SpyObj<RosterService>;
  let attendanceService: jasmine.SpyObj<AttendanceService>;
  let memberKnowledgeService: jasmine.SpyObj<MemberKnowledgeService>;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    rosterService = jasmine.createSpyObj<RosterService>('RosterService', [
      'getRoster',
      'searchByCallsign',
      'searchByCallsignOrName'
    ]);
    attendanceService = jasmine.createSpyObj<AttendanceService>('AttendanceService', [
      'getAttendance',
      'isRecorded'
    ]);
    memberKnowledgeService = jasmine.createSpyObj<MemberKnowledgeService>('MemberKnowledgeService', [
      'isKnown'
    ]);
    httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);

    rosterService.getRoster.and.returnValue(of({ members: [] }));
    rosterService.searchByCallsign.and.returnValue(of([]));
    rosterService.searchByCallsignOrName.and.returnValue(of([]));
    attendanceService.getAttendance.and.returnValue(of([]));
    attendanceService.isRecorded.and.returnValue(false);
    memberKnowledgeService.isKnown.and.returnValue(false);
    httpClient.get.and.returnValue(of({ status: 'INVALID' }));

    await TestBed.configureTestingModule({
      imports: [AttendanceComponent],
      providers: [
        provideRouter([]),
        { provide: RosterService, useValue: rosterService },
        { provide: AttendanceService, useValue: attendanceService },
        { provide: MemberKnowledgeService, useValue: memberKnowledgeService },
        { provide: HttpClient, useValue: httpClient }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide unknown members when set to known visibility', () => {
    rosterService.searchByCallsign.and.returnValue(of([
      { callsign: 'K1ABC', name: 'Known Person', clubs: [] },
      { callsign: 'K2XYZ', name: 'Unknown Person', clubs: [] }
    ]));
    memberKnowledgeService.isKnown.and.callFake((callsign: string) => callsign === 'K1ABC');

    component.searchTerm = 'K';
    component.setMemberVisibility('known');

    expect(component.matchedMembers.map(member => member.callsign)).toEqual(['K1ABC']);
  });

  it('should show only unknown members when set to unknown visibility', () => {
    rosterService.searchByCallsign.and.returnValue(of([
      { callsign: 'K1ABC', name: 'Known Person', clubs: [] },
      { callsign: 'K2XYZ', name: 'Unknown Person', clubs: [] }
    ]));
    memberKnowledgeService.isKnown.and.callFake((callsign: string) => callsign === 'K1ABC');

    component.searchTerm = 'K';
    component.setMemberVisibility('unknown');

    expect(component.matchedMembers.map(member => member.callsign)).toEqual(['K2XYZ']);
  });

  it('should not add hidden external matches', () => {
    httpClient.get.and.returnValue(of({
      status: 'VALID',
      name: 'Unknown Person',
      current: { callsign: 'K9XYZ' }
    }));
    memberKnowledgeService.isKnown.and.returnValue(false);
    component.memberVisibility = 'known';
    component.searchTerm = 'K9XYZ';

    component.onEnter();

    expect(component.matchedMembers).toEqual([]);
  });
});
