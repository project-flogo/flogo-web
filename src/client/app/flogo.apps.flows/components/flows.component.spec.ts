import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Component, Output, EventEmitter, DebugElement}    from '@angular/core';
import {TranslateModule, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';
import {Http} from '@angular/http';
import {FlogoApplicationFlowsComponent} from './flows.component';
import { FlogoModal } from '../../../common/services/modal.service';
import {TimeFromNowPipe} from "../../../common/pipes/time-from-now.pipe";
import {FlogoDeletePopupComponent} from "../../../common/components/delete.popup.component";

@Component({
  selector: 'container',
  template: `
                <div class="flows">
                    <flogo-apps-flows [flows]="flows"></flogo-apps-flows>
                </div>
            `
})
class Container {
  @Output() changes = new EventEmitter();
  flows: Array<any> = [
    {
      id: '879',
      name: 'Log temperature',
      description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
      createdAt: new Date()
    },
    {
      id: '869',
      name: 'Log temperature 2',
      description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
      createdAt: new Date()
    },
    {
      id: '897',
      name: 'Manually adjust temperature',
      description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
      createdAt: new Date()
    },
    {
      id: '987',
      name: 'Raise temperature & notifiy operator',
      description: 'A basic flow for apietusam',
      createdAt: new Date()
    }
  ];

  flowsDisorder: Array<any> = [
    {
      id: '897',
      name: 'Manually adjust temperature',
      description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
      createdAt: new Date()
    },
    {
      id: '987',
      name: 'Raise temperature & notifiy operator',
      description: 'A basic flow for apietusam',
      createdAt: new Date()
    },
    {
      id: '879',
      name: 'Log temperature',
      description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
      createdAt: new Date()
    },
    {
      id: '869',
      name: 'Try to find pet',
      description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
      createdAt: new Date()
    }
  ];

  // helper function to repeat the event propagation
  changed(value, property) {
    this.changes.emit(value);
  }
}

describe('Application flows', () => {
  let fixture: ComponentFixture<Container>,
    de:      DebugElement, el:      HTMLElement;
  function compileComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/base/dist/public/assets/i18n', '.json'),
        deps: [Http]
      })],
      declarations: [ FlogoApplicationFlowsComponent, ModalComponent, Container, TimeFromNowPipe, FlogoDeletePopupComponent ], // declare the test component
      providers: [FlogoModal]
    });
  });

  it('Should order the flows in alphabetical order', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(Container);
        let comp = fixture.componentInstance;
        comp.flows = comp.flowsDisorder;
        fixture.detectChanges();
        let res = fixture.debugElement.queryAll(By.css('.flogo-flow-title'));
        let nameList = res.map(element => element.nativeElement.innerHTML.trim());
        expect(nameList).toEqual(['Log temperature', 'Manually adjust temperature', 'Raise temperature &amp; notifiy operator', 'Try to find pet']);
        done();
      });
  });

  it('Should render 4 flows', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(Container);
        fixture.detectChanges();
        let res:Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-flow'));
        expect(res.length).toEqual(4);
        done();
      });
  });

  it('Should display the flow title', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(Container);
        fixture.detectChanges();
        de = fixture.debugElement.query(By.css('.flogo-flow-title:nth-of-type(1)'));
        el = de.nativeElement;
        expect(el.innerText).toEqual('Log Temperature');
        done();
      });
  });

  it('Should display the flow description', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(Container);
        fixture.detectChanges();
        let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-flow-description'));
        el = res[3].nativeElement;
        expect(el.innerText).toEqual('A basic flow for apietusam');
        done();
      });
  });

});

