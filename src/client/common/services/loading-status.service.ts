import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/share';

@Injectable()
export class LoadingStatusService {
  public _statusSource: Subject<boolean> = new Subject<boolean>();
  private _active: boolean = true;

  public get status(): Observable<boolean> {
    return this._statusSource.asObservable();
  }

  public get active(): boolean {
    return this._active;
  }

  public set active(v: boolean) {
    this._active = v;
    this._statusSource.next(v);
  }

  public start(): void {
    this.active = true;
  }

  public stop(): void {
    this.active = false;
  }
}
