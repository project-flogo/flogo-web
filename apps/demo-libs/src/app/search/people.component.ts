import { Component, Input } from '@angular/core';
import { Person } from './person';

@Component({
  selector: 'demo-search-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.less'],
})
export class PeopleComponent {
  @Input() people: Person[];
  @Input() title: string;
}
