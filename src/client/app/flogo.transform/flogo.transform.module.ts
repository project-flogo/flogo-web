import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {CommonModule as FlogoCommonModule} from '../../common/common.module';

import {TransformComponent} from './components/transform.component';

import {ErrorDisplayComponent} from './components/error-display.component';
import {HelpComponent} from './components/help.component';
import {MapEditorComponent} from './components/map-editor.component';
import {TransformJsonPanelComponent} from './components/transform-json-panel.component';
import {TransformMapperComponent} from './components/transform-mapper.component';
import {TransformMapperField} from './components/transform-mapper-field.component';
import {VisualMapperComponent} from './components/visual-mapper.component';
import {VisualMapperInputComponent} from './components/visual-mapper-input.component';
import {VisualMapperOutputComponent} from './components/visual-mapper-output.component';

@NgModule({
  imports: [// module dependencies
    NgCommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlogoCommonModule
  ],
  declarations: [
    ErrorDisplayComponent,
    HelpComponent,
    MapEditorComponent,
    TransformJsonPanelComponent,
    TransformMapperField,
    TransformMapperComponent,
    VisualMapperComponent,
    VisualMapperInputComponent,
    VisualMapperOutputComponent,
    TransformComponent
  ],
  exports: [
    TransformComponent
  ],
  providers: [
  ]
})
export class TransformModule {
}
