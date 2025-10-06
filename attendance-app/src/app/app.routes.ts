import { Routes } from '@angular/router';
import { AttendanceComponent } from './components/attendance/attendance.component';
import { AboutComponent } from './components/about/about.component';
import { BrowseComponent } from './components/browse/browse.component';

export const routes: Routes = [
  { path: '', component: AttendanceComponent },
  { path: 'about', component: AboutComponent },
  { path: 'browse', component: BrowseComponent }
];
