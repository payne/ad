import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BUILD_TIMESTAMP } from '../../build-info';

@Component({
  selector: 'app-about',
  imports: [MatCardModule, DatePipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly repoUrl = 'https://github.com/payne/ad';
  readonly buildTimestamp = new Date(BUILD_TIMESTAMP);
}
