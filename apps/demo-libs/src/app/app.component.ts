import { Component } from '@angular/core';

@Component({
  selector: 'demo-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  pages = [
    { label: 'Home', path: ['/'] },
    { label: 'Notifications', path: ['/notifications'] },
    { label: 'Modals', path: ['/modals'] },
    { label: 'Context Panel', path: ['/context-panel'] },
    { label: 'Search', path: ['/search'] },
  ];
}

@Component({
  selector: 'demo-home',
  template: '<h1>Welcome to Flogo Web Libs demo!</h1>',
})
export class HomeComponent {}
