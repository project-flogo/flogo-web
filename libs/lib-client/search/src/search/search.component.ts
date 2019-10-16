import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostBinding,
} from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, tap, map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'flogo-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements AfterViewInit, OnDestroy {
  /**
   * placeholder to display
   */
  @Input() placeholder?: string;
  /**
   * where to place the search icon (currently a mangnifying glass)
   */
  @Input() iconPosition: 'left' | 'right' = 'right';
  /**
   * whether the search should emit on key up or only on enter/escape/blur
   * when true the search event will be triggered when the user types or hits escape or enter or the input is blurred
   * when false the search event will be triggered when the user hits escape or enter or the input is blured. Individual keystrokes won't
   *  trigger the search event
   */
  @Input() emitOnKey = true;

  /**
   * Emits when the search query changes
   */
  @Output() search = new EventEmitter<string>();

  /**
   * Update the query to display in the input control before next user change.
   * Useful to provide an initial value to display when the component initializes
   * Note: this won't trigger any change events
   */
  @Input() set query(query: string) {
    query = query !== undefined ? query : '';
    if (query !== this.currentValue) {
      this.currentValue = query;
    }
  }

  currentValue = '';
  @ViewChild('searchInput', { static: true }) input: ElementRef;
  private subscription: Subscription;

  @HostBinding('class.icon-left')
  get isIconLeft() {
    return this.iconPosition === 'left';
  }

  onQueryChange(event: Event) {
    this.currentValue = (event.target as HTMLInputElement).value;
  }

  ngAfterViewInit() {
    const input = this.input.nativeElement;
    const key$ = fromEvent(input, 'keyup').pipe(shareReplay(1));
    const esc$ = key$.pipe(
      filter((e: KeyboardEvent) => e.key === 'Escape' || e.key === 'Esc'),
      tap(() => (this.input.nativeElement.value = ''))
    );
    const enter$ = key$.pipe(filter((e: KeyboardEvent) => e.key === 'Enter'));
    const change$ = fromEvent(input, 'change');
    const userTyping$ = key$.pipe(filter(() => this.emitOnKey));

    this.subscription = merge(userTyping$, change$, esc$, enter$)
      .pipe(
        map(() => this.input.nativeElement.value),
        distinctUntilChanged()
      )
      .subscribe(this.search);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
