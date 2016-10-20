import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FlogoConfigComponent } from './components/config.component';
import { ServiceStatusIndicatorComponent } from './components/service-status-indicator.component';

import { routing } from './flogo.config.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    routing
  ],
  declarations: [
    FlogoConfigComponent,
    ServiceStatusIndicatorComponent
  ],
})
export class ConfigModule {}
