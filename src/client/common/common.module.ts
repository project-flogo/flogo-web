import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule as NgCommonModule } from '@angular/common';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';
import { TranslateModule, TranslateLoader } from 'ng2-translate/ng2-translate';
import { Http, HttpModule as NgHttpModule } from '@angular/http'


import { CopyToClipboardComponent, INFORMATION_POPUP_DIRECTIVES } from './components';
import { TimeFromNowPipe } from './pipes';
import { Contenteditable, JsonDownloader, AutofocusDirective, EditableInputDirective, DraggableDirective } from './directives';
import { LoadingIndicatorComponent } from "./components/loading-indicator.component";
import { CustomTranslateLoader } from './services/language.service';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import {FlogoDeletePopupComponent} from "./components/delete.popup.component";


const ALL_MODULE_DECLARABLES = [
  CopyToClipboardComponent,
  ...INFORMATION_POPUP_DIRECTIVES,
  Contenteditable,
  JsonDownloader,
  LoadingIndicatorComponent,
  AutofocusDirective,
  DraggableDirective,
  EditableInputDirective,
  TimeFromNowPipe,
  ClickOutsideDirective,
  FlogoDeletePopupComponent
];

@NgModule({ // module dependencies
  imports: [
    NgCommonModule,
    NgHttpModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useClass: CustomTranslateLoader,
      deps: [Http]
    })
  ],
  declarations: ALL_MODULE_DECLARABLES,
  exports: [
    ...ALL_MODULE_DECLARABLES,
    Ng2Bs3ModalModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CommonModule { }
