import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSidenavComponent } from './chat-sidenav.component';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { ScrollbarModule } from '../../../@fury/shared/scrollbar/scrollbar.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [ChatSidenavComponent],
  imports: [
    CommonModule,
    MaterialModule,
    ScrollbarModule,
    ReactiveFormsModule,
    FlexLayoutModule
  ],
  exports: [ChatSidenavComponent]
})
export class ChatSidenavModule {}
