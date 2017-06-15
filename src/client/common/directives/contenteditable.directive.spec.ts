import {Component, Output, EventEmitter, DebugElement} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Contenteditable } from './contenteditable.directive';
import { SanitizeService } from './../../common/services/sanitize.service';

@Component({
    selector: 'container',
    template: `
            <h3 [(myContenteditable)]="name"
            (myContenteditableChange)="changed($event,null)"></h3>
            `
})
class Container {
    @Output() changes = new EventEmitter();
    name: string = '';

    // helper function to repeat the event propagation
    changed(value, property) {
        this.changes.emit(value);
    }
}

describe('Directive: Contenteditable', ()=> {
    let fixture: ComponentFixture<Container>, de: DebugElement, container: Container, element: HTMLElement;
    beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [SanitizeService],
            declarations: [ Contenteditable, Container ]
        });
    });


    it('Changing the model variable should change the inner text', () => {
        fixture = TestBed.createComponent(Container);
        container = fixture.componentInstance;
        de = fixture.debugElement.query(By.directive(Contenteditable));
        element = de.nativeElement;
        container.name = 'a new name';
        fixture.detectChanges();
        expect(element.innerText).toBe('a new name');
    });

    it('Blur event should emit the edited value', done => {
        fixture = TestBed.createComponent(Container);
        container = fixture.componentInstance;
        fixture.detectChanges();

        let h3Debug = fixture.debugElement.query(By.directive(Contenteditable));

        container.changes.subscribe(value => {
            expect(value).toEqual('A new value');
            done();
        });

        let h3Element = h3Debug.nativeElement;
        h3Debug.triggerEventHandler('focus', null);
        fixture.detectChanges();
        h3Element.innerHTML = 'A new value';
        h3Debug.triggerEventHandler('blur', null);
        fixture.detectChanges();

    });
});

