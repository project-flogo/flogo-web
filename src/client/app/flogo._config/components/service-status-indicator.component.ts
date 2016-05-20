import {Component, Input, OnInit, DoCheck, OnDestroy} from '@angular/core';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject,Subscription} from "rxjs/Rx";
import { getURL } from '../../../common/utils';

const PING_INTERVAL_MS = 2500;

@Component({
  selector: 'flogo-_config-service-status-indicator',
  moduleId: module.id,
  template: `<i [title]="info" class="fa" [style.color]="color"
                [ngClass]="{'fa-circle': status == 'online' || status == 'offline' || status == 'online-warning', 'fa-circle-o': !status}"></i>`
})
export class ServiceStatusIndicatorComponent implements OnInit, DoCheck, OnDestroy {

  @Input() urlConfig:{protocol:string, host:string, port:string, name?:string, testPath?: string} = null;
  status : string = null;
  statusCode : any = null;

  private configChangeSubject : BehaviorSubject<any> = null;
  private subscription : Subscription = null;
  private colors : any = {
    'online': 'green',
    'online-warning': 'gold',
    'offline': 'red',
    'unknown': 'orange'
  };

  constructor(private http:Http) {
    this.configChangeSubject = new BehaviorSubject(this.buildUrl());
  }

  ngOnInit() {
    let configChangeStream = this.configChangeSubject.distinctUntilChanged();

    configChangeStream.subscribe(() => this.status = null);

    this.subscription = Observable
      .interval(PING_INTERVAL_MS)
      .combineLatest(configChangeStream)
      .map(combined => combined[1])
      .map((url:string) => this.http.get(url))
      .switch()
      .catch((error:any) => {
        this.statusCode = error.status;
        // status 200 means no response from server
        if(error.status != 200) {
          this.status = 'online-warning';
        } else {
          this.status = 'offline'
        }
        // TODO: report if error 500?
        // TODO: when there are cors issues we get also 200 code
        return Observable.throw(error);
      })
      .retry()
      .subscribe((result:any) => {
        this.status = 'online';
        this.statusCode = result.status;
      });

  }

  ngDoCheck() {
    this.configChangeSubject.next(this.buildUrl());
  }

  // TODO: Not always executed thus observers are always on, should be fixed in next angular release: https://github.com/angular/angular/issues/8458
  ngOnDestroy() {
    console.log('Destroying', this.buildUrl());
    if(this.subscription) {
      console.log('Unsubscribing');
      this.subscription.unsubscribe();
    } else {
      console.log('Not unsubscribing');
    }
  }

  get color() {
    return this.colors[this.status] || this.colors.unknown;
  }

  get info() {
    if(this.status == 'online-warning') {
      return `Online but returned status code ${this.statusCode}`;
    }
    return '';
  }

  private buildUrl() {
    if(this.urlConfig) {
      let config = this.urlConfig;
      let name = this.urlConfig.name ? `/${this.urlConfig.name}` : '';
      let testPath = this.urlConfig.testPath ? `/${this.urlConfig.testPath}` : '';
      return `${getURL(config)}${name}${testPath}`;
    }
    return null;
  }


}
