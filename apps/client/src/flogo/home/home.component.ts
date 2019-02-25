import { fromEvent, timer, Subscription } from 'rxjs';
import { bufferCount, exhaustMap } from 'rxjs/operators';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@flogo-web/core';
import { FlowSummary, AppsApiService } from '@flogo-web/client-core';

@Component({
  selector: 'flogo-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.less'],
})
export class FlogoHomeComponent implements OnInit, OnDestroy {
  public recent: Array<any> = [];
  flows: Array<FlowSummary> = [];
  application: App = null;

  isFlying = false;
  private flynnFlightSubscription: Subscription;

  constructor(
    private router: Router,
    public applicationServiceAPI: AppsApiService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadFlows();
  }

  ngOnDestroy() {
    if (this.flynnFlightSubscription) {
      this.flynnFlightSubscription.unsubscribe();
    }
  }

  loadFlows() {
    this.applicationServiceAPI.recentFlows().then((flows: Array<any>) => {
      flows = flows.length <= 10 ? flows : flows.slice(0, 10);
      this.recent = flows;
    });
  }

  onSelectedApp(application: App) {
    this.router.navigate(['/apps', application.id]);
  }

  onFlynnLoaded(event) {
    const contentDocument = event && event.target && event.target.contentDocument;
    if (!contentDocument || !contentDocument.children || !contentDocument.children[0]) {
      return;
    }
    const flynnSvg = event.target.contentDocument.children[0];
    const startFlight = () => (this.isFlying = true);
    const endFlight = () => (this.isFlying = false);
    this.flynnFlightSubscription = fromEvent(flynnSvg, 'click')
      .pipe(
        bufferCount(3),
        exhaustMap(() => {
          this.ngZone.run(startFlight);
          return timer(5000);
        })
      )
      .subscribe(() => this.ngZone.run(endFlight));
  }
}
