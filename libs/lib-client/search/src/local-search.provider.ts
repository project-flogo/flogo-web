import { FactoryProvider } from '@angular/core';
import { LocalSearch, LocalSearchParams } from './local-search';

export function makeLocalSearchFactory(params: LocalSearchParams) {
  return () => new LocalSearch(params);
}

export const makeLocalSearchProvider: (
  params: LocalSearchParams
) => FactoryProvider = params => ({
  provide: LocalSearch,
  useFactory: makeLocalSearchFactory(params),
});
