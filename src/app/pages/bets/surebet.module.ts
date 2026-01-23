import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { ScrollbarModule } from '../../../@fury/shared/scrollbar/scrollbar.module';
import { SurebetRoutingModule } from './surebet-routing.module';
import { SurebetComponent } from './surebet.component';
import { CalculatorComponent } from './calculator/calculator.component';
import { SurebetRepository } from '../../core/repositories/surebet.repository';
import { SurebetApiRepository } from '../../core/repositories/surebet-api.repository';
import { SurebetService } from '../../core/services/surebet.service';

@NgModule({
  imports: [
    CommonModule,
    SurebetRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    ScrollbarModule,
    HttpClientModule
  ],
  declarations: [SurebetComponent, CalculatorComponent],
  providers: [
    {
      provide: SurebetRepository,
      useClass: SurebetApiRepository
    },
    SurebetService
  ]
})
export class SurebetModule {
}
