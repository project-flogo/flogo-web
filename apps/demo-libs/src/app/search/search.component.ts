import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalSearch, makeLocalSearchFactory } from '@flogo-web/lib-client/search';
import { Person } from './person';

@Component({
  selector: 'demo-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  providers: [
    {
      provide: LocalSearch,
      useFactory: makeLocalSearchFactory({ matchFields: ['name', 'country'] }),
    },
  ],
})
export class SearchComponent implements OnInit {
  people: Person[];
  filteredPeopleList$: Observable<Person[]>;
  emitOnKey = true;
  lastQuery: string;
  customValue = 'customValue';
  lastCustomQuery: string;

  constructor(private searchService: LocalSearch<Person>) {}

  ngOnInit() {
    this.initList();
    this.searchService.setSourceList(this.people);
    this.filteredPeopleList$ = this.searchService.list$;
  }

  search(term: string) {
    this.lastQuery = term;
    this.searchService.search(term);
  }

  setEmitOnKey(emitOnKey: boolean) {
    this.emitOnKey = emitOnKey;
  }

  setCustomValue(customValue: string) {
    this.customValue = customValue;
  }

  customQueryChanged(newValue) {
    this.lastCustomQuery = newValue;
    this.customValue = newValue;
  }

  private initList() {
    this.people = [
      {
        id: 1,
        name: 'Ileana Marklin',
        country: 'Indonesia',
      },
      {
        id: 2,
        name: 'Dolores Terne',
        country: 'United States',
      },
      {
        id: 3,
        name: 'Dot Tedridge',
        country: 'Brazil',
      },
      {
        id: 4,
        name: 'Sumner Devericks',
        country: 'China',
      },
      {
        id: 5,
        name: 'Cort Ajsik',
        country: 'Israel',
      },
      {
        id: 6,
        name: 'Schuyler Goldis',
        country: 'China',
      },
      {
        id: 7,
        name: 'Jackelyn Husk',
        country: 'France',
      },
      {
        id: 8,
        name: 'Pet Barthorpe',
        country: 'Canada',
      },
      {
        id: 9,
        name: 'Vinson Brinkler',
        country: 'Turkmenistan',
      },
      {
        id: 10,
        name: 'Ari Showering',
        country: 'Russia',
      },
      {
        id: 11,
        name: 'Nils Rivalant',
        country: 'Russia',
      },
      {
        id: 12,
        name: 'Howard Mitkin',
        country: 'Portugal',
      },
      {
        id: 13,
        name: 'Dietrich Brummell',
        country: 'Cuba',
      },
      {
        id: 14,
        name: 'Brad Greenlees',
        country: 'Azerbaijan',
      },
      {
        id: 15,
        name: 'Patrice Grice',
        country: 'Philippines',
      },
      {
        id: 16,
        name: 'Philip Brymham',
        country: 'Indonesia',
      },
      {
        id: 17,
        name: 'Lowell Hixson',
        country: 'Colombia',
      },
      {
        id: 18,
        name: 'Carly Whaites',
        country: 'Argentina',
      },
      {
        id: 19,
        name: 'Naomi Derrington',
        country: 'Brazil',
      },
      {
        id: 20,
        name: 'Zebadiah Benzing',
        country: 'Ukraine',
      },
      {
        id: 21,
        name: 'Hewie Treleaven',
        country: 'Panama',
      },
      {
        id: 22,
        name: 'Doralin Ackermann',
        country: 'Nigeria',
      },
      {
        id: 23,
        name: 'Babbette Novotni',
        country: 'Russia',
      },
      {
        id: 24,
        name: 'Adena Claypoole',
        country: 'Austria',
      },
      {
        id: 25,
        name: 'Findley Riseborough',
        country: 'China',
      },
    ];
  }
}
