import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';
import {TranslateModule} from 'ng2-translate/ng2-translate';

import { CopyToClipboardComponent, INFORMATION_POPUP_DIRECTIVES } from './components'
import { Contenteditable, JsonDownloader } from './directives';
import { LoadingIndicatorComponent } from "./components/loading-indicator.component";

const ALL_MODULE_DECLARABLES = [
  CopyToClipboardComponent,
  ...INFORMATION_POPUP_DIRECTIVES,
  Contenteditable,
  JsonDownloader,
  LoadingIndicatorComponent
];

@NgModule({ // module dependencies
  imports: [
    NgCommonModule,
    TranslateModule.forRoot()
  ],
  declarations: ALL_MODULE_DECLARABLES,
  exports: [
    ...ALL_MODULE_DECLARABLES,
    Ng2Bs3ModalModule,
    TranslateModule
  ]
})
export class CommonModule { }
