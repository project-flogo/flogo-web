# Search (`@flogo-web/lib-client/search`)

## Usage

### SearchComponent

1. Import the search module into your module

```typescript
// my.module.ts
import { NgModule } from '@angular/core';
import { SearchModule } from '@flogo-web/lib-client/search';

@NgModule({
  imports: [SearchModule],
  declarations: [],
  entryComponents: [],
})
export class MyModule {}
```

2. Use it in your component template like:

```html
<flogo-search
  (search)="onSearchChange($event)"
  [emitOnKey]="false"
  placeholder="Search"
></flogo-search>
```

### LocalSearch

The `LocalSearch` utility class encapsulates the logic required to make simple searching/filtering
in a given array of objects.

#### Instantiate the `LocalSearch`

You can either A. use a factory provider or B. manually create an instance

**Option A. Use a factory provider**

Add the provider definition using the `makeLocalSearchFactory()` function provided by this module. In the following example
we're declaring the provider at the component level but you can declare it wherever fits your needs.
After that you can inject the `LocalSearch` service in a constructor.

This option is a little more complex than option B but allows to mock the local search instance more easily in unit tests.

```typescript
import { Component } from '@angular/core';
import { makeLocalSearchFactory, LocalSearch } from '@flogo-web/lib-client/search';

@Component({
  template: '...',
  providers: [
    // declare the provider
    {
      provide: LocalSearch,
      // use the provider factory
      useFactory: makeLocalSearchFactory({
        // specify which fields to target in the search
        matchFields: ['name', 'description'],
        // (optional) debounce the search events by this milliseconds
        debounceMs: 250,
      }),
    },
  ],
})
class MyComponent {
  // inject the local search instance
  constructor(private searchService: LocalSearch) {}
}
```

**Option B. Manually create an instance**

```typescript
import { Component } from '@angular/core';
import { LocalSearch } from '@flogo-web/lib-client/search';

@Component({
  template: '...',
})
class MyComponent {
  private searchService: LocalSearch;

  constructor() {
    // create the instance using the new operator
    this.searchService = new LocalSearch({
      // specify which fields to target in the search
      matchFields: ['name', 'description'],
      // (optional) debounce the search events by this milliseconds
      debounceMs: 250,
    });
  }
}
```

#### Using the local search

Example:

```typescript
// my.component.ts
import { Component, OnInit } from '@angular/core';
import { LocalSearch } from '@flogo-web/lib-client/search';
import { Observable } from 'rxjs';

@Component({
  // ...,
  templateUrl: 'my.component.html',
})
class MyComponent implements OnInit {
  filteredList$: Observable<ListElement[]>;

  constructor(
    private searchService: LocalSearch,
    private someService: SomeOtherService<ListElement>
  ) {}

  ngOnInit() {
    // LocalService pushes the filtered list to its list$ observable
    // here we're saving the filtered list as a class reference so we can use it in the template
    this.filteredList$ = this.searchService.list$;
    this.someService.fetchAll().subscribe((list: ListElement[]) => {
      // we need to notify the LocalSearch service when we get new data
      this.searchService.setSourceList(list);
    });
  }

  onSearch(query: string) {
    // call the search() method when you wish to update the search query
    this.searchService.search(query);
  }
}
```

```html
<!--my.component.html-->
<ul>
  <!-- we can iterate over the filtered list using the async pipe-->
  <li *ngFor="let element of filteredList$ | async">
    {{ element.name }}
  </li>
</ul>
```

### Integrating the Search component and the LocalSearch service

The search component and LocalSearch service were implemented so they can be used easily together and solve many common
use cases. But they were also designed so they are decoupled from each other so you can also use them separately.

Here's an example of how to use the service and the component together:

```typescript
// users-search.component.ts
import { Component, OnInit } from '@angular/core';
import { LocalSearch, makeLocalSearchFactory } from '@flogo-web/lib-client/search';
import { Observable } from 'rxjs';

@Component({
  // ...,
  providers: [
    {
      provide: LocalSearch,
      useFactory: makeLocalSearchFactory({ matchFields: ['name'] }),
    },
  ],
  templateUrl: 'users-search.component.html',
})
class UsersSearchComponent implements OnInit {
  filteredUsers$: Observable<User[]>;

  constructor(private searchService: LocalSearch, private userService: UserService) {}

  ngOnInit() {
    this.filteredUsers$ = this.searchService.list$;
    this.userService.getAll().subscribe((users: User[]) => {
      this.searchService.setSourceList(users);
    });
  }

  filterUsers(query: string) {
    this.searchService.search(query);
  }
}
```

```html
<!--users-search.component.html-->

<flogo-search (search)="filterUsers($event)" placeholder="Search users"></flogo-search>

<ul>
  <li *ngFor="let users of filteredUsers$ | async">
    {{ user.name }}
  </li>
</ul>
```
