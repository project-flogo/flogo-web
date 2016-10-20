import { NgModule }      from '@angular/core';
import { APP_BASE_HREF } from '@angular/common'
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { CommonModule } from './common/common.module';
import { CoreModule } from './common/core.module'
import { FlogoModule } from './app/flogo/flogo.module';

import { FlogoAppComponent as AppComponent } from './app/flogo/components/flogo.component';

@NgModule({
  imports: [ // module dependencies
    BrowserModule,
    HttpModule,
    FormsModule,
    CoreModule,
    CommonModule,
    FlogoModule
  ],
  declarations: [],   // components and directives
  bootstrap: [ AppComponent ],     // root component
  providers: [ // services
    {provide: APP_BASE_HREF, useValue: '/'}
  ]
})
export class MainModule { }

