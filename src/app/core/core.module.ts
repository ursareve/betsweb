import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SurebetRepository } from './repositories/surebet.repository';
import { SurebetApiRepository } from './repositories/surebet-api.repository';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    {
      provide: SurebetRepository,
      useClass: SurebetApiRepository
    },
    SurebetApiRepository
  ]
})
export class CoreModule {}
