import {ComponentFixture, TestBed, tick, fakeAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import {TranslateModule, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import {Http} from '@angular/http';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';
import { Router, RouterOutlet, RouterModule } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

import { LoadingStatusService } from '../../../common/services/loading-status.service';
import { FlogoAppComponent } from './flogo.component';
import { FlowsModule as FlogoFlowsModule } from '../../flogo.flows/flogo.flows.module';
import { CommonModule as FlogoCommonModule } from '../../../common/common.module';
import { CoreModule as FlogoCoreModule } from '../../../common/core.module';
import { FlogoNavbarComponent } from './../../flogo/components/navbar.component';
import { FlogoInstructionsComponent } from './../../flogo.instructions/components/instructions.component';
import { LoadingIndicatorComponent } from '../../../common/components/loading-indicator.component';
import { FlogoModal } from '../../../common/services/modal.service';



class MockRouter { public navigate() {}; }

class FlogoAppComponentMocked extends FlogoAppComponent {
  getUserLanguage() {
    this.DEFAULT_LANGUAGE = 'mocked-english-language';
    return 'mocked-x-language';
  }
}

class FlogoAppComponentNonExistentLanguage extends FlogoAppComponent {
  getUserLanguage() {
    this.DEFAULT_LANGUAGE = 'mocked-english-language';
    return 'unexistent-languge';
  }
}

class FlogoAppComponentEnglishLanguage extends FlogoAppComponent {
  getUserLanguage() {
    this.DEFAULT_LANGUAGE = 'mocked-english-language';
    return 'mocked-english-language';
  }
}

describe('FlogoApp component', () => {
  function compileComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(() => {
    window['jasmine'].DEFAULT_TIMEOUT_INTERVAL = 3000;

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: MockRouter }
        ]),
        TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/base/i18n', '.json'),
        deps: [Http]
      }),
      ],
      declarations: [
        FlogoAppComponent,
        FlogoAppComponentMocked,
        FlogoAppComponentNonExistentLanguage,
        FlogoAppComponentEnglishLanguage,
        FlogoNavbarComponent,
        FlogoInstructionsComponent,
        LoadingIndicatorComponent,
        ModalComponent
      ], // declare the test component
      providers: [
        {provide: LoadingStatusService, useClass: LoadingStatusService},
        {provide: FlogoModal, useClass: FlogoModal}
      ]
    });
  });

  it('Should use the i18n JSON file based on the user language setting', (done) => {
    compileComponent()
      .then(() => {
        let fixture: ComponentFixture<FlogoAppComponentEnglishLanguage> = TestBed.createComponent(FlogoAppComponentEnglishLanguage);
        let comp: FlogoAppComponentEnglishLanguage = fixture.componentInstance;
        fixture.detectChanges();

        setTimeout(()=> {
          let translated = comp.translate.get('MOCKED-KEY');
          translated.subscribe((val)=> {
           expect(val).toEqual('The value of the mocked key in english language');
           done();
          });
        },1000);

      });
  });

  it('If the user language is mocked-language it should translate properly in mocked-language', (done) => {
    compileComponent()
      .then(() => {
        let fixture: ComponentFixture<FlogoAppComponentMocked> = TestBed.createComponent(FlogoAppComponentMocked);
        let comp: FlogoAppComponentMocked = fixture.componentInstance;
        fixture.detectChanges();

        setTimeout(()=> {
          let translated = comp.translate.get('MOCKED-KEY');
          translated.subscribe((val)=> {
              expect(val).toEqual('The value of the mocked key in mocked language');
              done();
            });
        },1000);
      });
  });

  it('If the user language is "mocked-language" and the language key is not defined in JSON file, it should take the english key version', (done) => {
    compileComponent()
      .then(() => {
        let fixture: ComponentFixture<FlogoAppComponentMocked> = TestBed.createComponent(FlogoAppComponentMocked);
        let comp: FlogoAppComponentMocked = fixture.componentInstance;
        fixture.detectChanges();

        setTimeout(()=> {
          let translated = comp.translate.get('MOCKED-KEY-2');
          translated.subscribe((val)=> {
            expect(val).toEqual('This is the mocked key 2');
            done();
          });
        },1000);
      });
  });

  it('If we don\'t have an i18n JSON file to support the user language, then we\'re going to translate using English ', (done) => {
    compileComponent()
      .then(() => {
        let fixture: ComponentFixture<FlogoAppComponentNonExistentLanguage> = TestBed.createComponent(FlogoAppComponentNonExistentLanguage);

        let comp: FlogoAppComponentMocked = fixture.componentInstance;
        fixture.detectChanges();

        setTimeout(()=> {
          let translated = comp.translate.get('MOCKED-KEY');
          translated.subscribe((val)=> {
            expect(val).toEqual('The value of the mocked key in english language');
            done();
          });
        },1000);
      });
  });


});
