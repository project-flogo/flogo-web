import { isEmpty } from 'lodash';
import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  map,
  shareReplay,
} from 'rxjs/operators';

type QueryMatcherFn<T> = (query: string) => (obj: T) => boolean;

export interface LocalSearchParams {
  matchFields: string[];
  debounceMs?: number;
}

export class LocalSearch<T> {
  public readonly query$: Observable<string | null>;
  public readonly list$: Observable<T[]>;

  private sourceList = new ReplaySubject<T[]>(1);
  private querySrc = new ReplaySubject<string>();
  private queryMatcher: QueryMatcherFn<T>;

  constructor({ debounceMs, matchFields }: LocalSearchParams) {
    this.queryMatcher = fieldMatcher(matchFields);
    this.query$ = this.querySrc.pipe(
      debounceTime(debounceMs || 250),
      distinctUntilChanged(),
      startWith(''),
      shareReplay(1)
    );
    this.list$ = combineLatest(this.query$, this.sourceList).pipe(
      map(([query, list]) => this.filter(list, query))
    );
  }

  setSourceList(list: T[]) {
    this.sourceList.next(list);
  }

  search(query: string) {
    this.querySrc.next(query);
  }

  clear() {
    this.querySrc.next('');
  }

  private filter(list: T[], query: string): T[] {
    if (query && !isEmpty(query.trim())) {
      return list.filter(this.queryMatcher(query));
    }
    return list;
  }
}

function isQueryMatch(obj: any, query: string) {
  query = query.toLocaleLowerCase();
  return fieldName => {
    const target = obj[fieldName];
    return target ? target.toLocaleLowerCase().includes(query) : false;
  };
}

function fieldMatcher<T>(fields: string[]): QueryMatcherFn<T> {
  return (query: string) => {
    return (obj: T) => {
      if (obj) {
        return fields.some(isQueryMatch(obj, query));
      }
      return false;
    };
  };
}
