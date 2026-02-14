import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { StorageService } from '../../../core/services/storage.service';
import { User } from '../../../models/user.model';
import { ProfileUpdateComponent } from './profile-update/profile-update.component';
import { SweetAlertService } from '../../../services/sweet-alert.service';

@Component({
  selector: 'fury-toolbar-user',
  templateUrl: './toolbar-user.component.html',
  styleUrls: ['./toolbar-user.component.scss']
})
export class ToolbarUserComponent implements OnInit {

  isOpen: boolean;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private storageService: StorageService,
    private dialog: MatDialog,
    private alert: SweetAlertService
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(firebaseUser => {
      if (firebaseUser) {
        this.loadCurrentUser(firebaseUser.uid);
      }
    });
  }

  async loadCurrentUser(uid: string) {
    try {
      this.currentUser = await this.userService.getUser(uid);
    } catch (error) {
      console.error('Error al cargar usuario en toolbar:', error);
    }
  }

  getAvatarUrl(): string {
    if (this.currentUser?.avatarUrl) {
      return this.currentUser.avatarUrl;
    }
    return this.currentUser 
      ? `https://ui-avatars.com/api/?name=${this.currentUser.firstName}+${this.currentUser.lastName}&background=random`
      : 'assets/img/avatars/noavatar.png';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  onClickOutside() {
    this.isOpen = false;
  }

  openProfile() {
    this.isOpen = false;
    if (!this.currentUser) return;

    this.dialog.open(ProfileUpdateComponent, {
      data: { user: this.currentUser },
      width: '500px'
    }).afterClosed().subscribe(async (avatarFile: File) => {
      if (avatarFile && this.currentUser) {
        try {
          const avatarUrl = await this.storageService.uploadUserAvatar(avatarFile, this.currentUser.uid);
          await this.userService.updateUser(this.currentUser.uid, { avatarUrl });
          this.currentUser.avatarUrl = avatarUrl;
          this.alert.success('Actualizado', 'Foto de perfil actualizada');
        } catch (error) {
          console.error('Error al actualizar avatar:', error);
          this.alert.error('Error', 'Error al actualizar foto de perfil');
        }
      }
    });
  }

  async logout() {
    try {
      await this.authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

}
