import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';

import {CommonModule as FlogoCommonModule} from '../../common/common.module';

import {FlogoInstructionsComponent} from './components/instructions.component';

@NgModule({
  imports: [// module dependencies
    NgCommonModule,
    FlogoCommonModule
  ],
  declarations: [
    FlogoInstructionsComponent
  ],
  exports: [
    FlogoInstructionsComponent
  ],
  providers: [
  ]
})
export class InstructionsModule {
}
