import { LocalSearch, LocalSearchParams } from './local-search';

export function makeLocalSearchFactory(params: LocalSearchParams) {
  return () => new LocalSearch(params);
}
