import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BreadcrumbsModule } from '../../../@fury/shared/breadcrumbs/breadcrumbs.module';
import { ListModule } from '../../../@fury/shared/list/list.module';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { UsersRoutingModule } from './users-routing.module';
import { UsersComponent } from './users.component';
import { UserCreateUpdateModule } from './user-create-update/user-create-update.module';
import { FurySharedModule } from '../../../@fury/fury-shared.module';
import { CoreModule } from '../../core/core.module';

@NgModule({
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    MaterialModule,
    FurySharedModule,
    MatChipsModule,
    MatSlideToggleModule,
    ListModule,
    UserCreateUpdateModule,
    BreadcrumbsModule,
    CoreModule
  ],
  declarations: [UsersComponent],
  exports: [UsersComponent]
})
export class UsersModule {
}
