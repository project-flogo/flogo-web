import {Component, Output, EventEmitter} from '@angular/core';
import { FlogoApplicationFlowsComponent } from './flows.component';
import { describe, beforeEach, beforeEachProviders, it, inject, expect, injectAsync } from '@angular/core/testing';
import { HTTP_PROVIDERS } from '@angular/http';
import { TestComponentBuilder } from '@angular/compiler/testing';
import { TranslateService, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { By } from '@angular/platform-browser';

@Component({
    selector: 'container',
    template: `
                <div class="flows">
                    <flogo-app-flows [flows]="flows"></flogo-app-flows>
                </div>
            `,
    directives: [FlogoApplicationFlowsComponent]
})
export class Container {
    @Output() changes = new EventEmitter();
    flows : Array<any> = [
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
            name: 'Log temperature 2',
            description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
            createdAt: new Date()
        }
    ];

    // helper function to repeat the event propagation
    changed(value, property) {
        this.changes.emit(value);
    }
}

describe('Application flows', ()=> {
    let fixture, tcb: TestComponentBuilder;

    // setup
    beforeEachProviders(()=>[
        HTTP_PROVIDERS,
        TestComponentBuilder,
        Container,
        TranslateService,
        TranslateLoader,
    ]);

    beforeEach(injectAsync([TestComponentBuilder], (_tcb: TestComponentBuilder) => {
        tcb = _tcb;
    }));


    it('Should render 4 flows', done => {
        tcb.createAsync(Container)
            .then(fixture => {
                fixture.detectChanges();
                let flows = fixture.debugElement.queryAll(By.css('.flows-container > .flow'));
                expect(flows.length).toEqual(4);
                done();
            });
    });

    it('Should display the flow title', done => {
        tcb.createAsync(Container)
            .then(fixture => {
                fixture.detectChanges();
                let title = fixture.debugElement.query(By.css('.title:nth-of-type(1)'));
                expect(title.nativeElement.innerText).toEqual('Manually Adjust Temperature');
                done();
            });
    });

    it('Should display the flow description', done => {
        tcb.createAsync(Container)
            .then(fixture => {
                fixture.detectChanges();
                let description = fixture.debugElement.queryAll(By.css('.description'));
                expect(description[1].nativeElement.innerText).toEqual('A basic flow for apietusam');
                done();
            });
    });

});