import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {CommonModule as FlogoCommonModule} from '../../common/common.module';

import {FlogoInstallerComponent} from './components/installer.component';

import { FlogoInstallerCategorySelectorComponent } from '../flogo.installer.category-selector/components/category-selector.component';
import { FlogoInstallerTriggerComponent } from '../flogo.installer.trigger-installer/components/trigger-installer.component';
import { FlogoInstallerActivityComponent } from '../flogo.installer.activity-installer/components/activity-installer.component';
import { FlogoInstallerSearchComponent } from '../flogo.installer.search/components/search.component';
import { FlogoInstallerUrlComponent } from '../flogo.installer.url-installer/components/url-installer.component';
import { FlogoInstallerListViewComponent } from '../flogo.installer.list-view/components/list-view.component';
import { FlogoInstallerListViewItemComponent } from '../flogo.installer.list-view.item/components/item.component';

@NgModule({
  imports: [// module dependencies
    NgCommonModule,
    FormsModule,
    FlogoCommonModule
  ],
  declarations: [
    FlogoInstallerSearchComponent,
    FlogoInstallerCategorySelectorComponent,
    FlogoInstallerActivityComponent,
    FlogoInstallerTriggerComponent,
    FlogoInstallerUrlComponent,
    FlogoInstallerListViewComponent,
    FlogoInstallerListViewItemComponent,
    FlogoInstallerComponent
  ],
  exports: [
    FlogoInstallerComponent
  ],
  providers: [
  ]
})
export class InstallerModule {
}
