import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { ScrollbarModule } from '../../../@fury/shared/scrollbar/scrollbar.module';
import { SurebetRoutingModule } from './surebet-routing.module';
import { SurebetComponent } from './surebet.component';

@NgModule({
  imports: [
    CommonModule,
    SurebetRoutingModule,
    ReactiveFormsModule,
    MaterialModule,

    // Core
    ScrollbarModule,
  ],
  declarations: [SurebetComponent]
})
export class SurebetModule {
}
