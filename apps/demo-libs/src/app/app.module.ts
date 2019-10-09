import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';

import { CoreModule } from '@flogo-web/lib-client/core';
import { NotificationsModule } from '@flogo-web/lib-client/notifications';
import { ModalModule } from '@flogo-web/lib-client/modal';
import { ContextPanelModule } from '@flogo-web/lib-client/context-panel';
import { SearchModule } from '@flogo-web/lib-client/search';

import { AppComponent, HomeComponent } from './app.component';
import { NotificationsComponent } from './notifications';
import { ModalParentComponent, ModalDemoModule } from './modal';
import { ContextPanelComponent } from './context-panel/context-panel.component';
import { SearchComponent, PeopleComponent } from './search';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotificationsComponent,
    ContextPanelComponent,
    SearchComponent,
    PeopleComponent,
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    BrowserModule,
    OverlayModule,

    CoreModule,
    NotificationsModule,
    ModalModule,
    ContextPanelModule,
    SearchModule,

    RouterModule.forRoot(
      [
        { path: 'notifications', component: NotificationsComponent },
        { path: 'modals', component: ModalParentComponent },
        { path: 'context-panel', component: ContextPanelComponent },
        { path: 'search', component: SearchComponent },
        { path: '', component: HomeComponent },
        { path: '**', redirectTo: '' },
      ],
      {
        initialNavigation: 'enabled',
      }
    ),

    // app modules
    ModalDemoModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
