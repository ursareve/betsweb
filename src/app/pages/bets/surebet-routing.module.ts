import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SurebetComponent } from './surebet.component';

const routes: Routes = [
  {
    path: '',
    component: SurebetComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SurebetRoutingModule {
}
