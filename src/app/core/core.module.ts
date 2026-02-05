import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SurebetRepository } from './repositories/surebet.repository';
import { SurebetApiRepository } from './repositories/surebet-api.repository';
import { UserRepository } from './repositories/user.repository';
import { UserFirebaseRepository } from './repositories/user-firebase.repository';
import { UserApiRepository } from './repositories/user-api.repository';
import { UserService } from './services/user.service';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    {
      provide: SurebetRepository,
      useClass: SurebetApiRepository
    },
    SurebetApiRepository,
    {
      provide: UserRepository,
      useClass: UserFirebaseRepository  // Cambiar a UserApiRepository cuando esté lista la API
    },
    UserFirebaseRepository,
    UserApiRepository,
    UserService
  ]
})
export class CoreModule {}
