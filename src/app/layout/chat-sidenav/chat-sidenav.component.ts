import { Component, OnInit, ViewChild, OnDestroy, AfterViewChecked } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ScrollbarComponent } from '../../../@fury/shared/scrollbar/scrollbar.component';
import { ChatSidenavService } from './chat-sidenav.service';
import { UserService, UserWithOnlineStatus } from '../../core/services/user.service';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { NotificationServerService } from '../../core/services/notification-server.service';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'fury-chat-sidenav',
  templateUrl: './chat-sidenav.component.html',
  styleUrls: ['./chat-sidenav.component.scss']
})
export class ChatSidenavComponent implements OnInit, OnDestroy, AfterViewChecked {
  replyCtrl: UntypedFormControl;
  users$: Observable<UserWithOnlineStatus[]>;
  activeChat: UserWithOnlineStatus | null = null;
  showContacts: boolean = false;
  messages: ChatMessage[] = [];
  currentUserId: string = '';
  currentUser: UserWithOnlineStatus | null = null;
  showEmojiPicker: boolean = false;
  emojis: string[] = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '👋', '🤚', '🖐️', '✋', '🖖', '👊', '✊', '🤛', '🤜', '🤝',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕',
    '🔥', '⭐', '✨', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇'
  ];
  private conversationSubscription: Subscription | null = null;
  private shouldScrollToBottom = false;

  @ViewChild('messagesScroll', { read: ScrollbarComponent, static: true }) messagesScroll: ScrollbarComponent;

  constructor(
    private chatSidenavService: ChatSidenavService,
    private userService: UserService,
    private chatService: ChatService,
    private notificationServer: NotificationServerService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.replyCtrl = new UntypedFormControl();
    this.users$ = this.userService.users$;
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.uid;
      
      // Obtener datos completos del usuario actual
      this.userService.users$.subscribe(users => {
        this.currentUser = users.find(u => u.uid === this.currentUserId) || null;
      });
    }
    
    // Suscribirse a cambios en conversaciones
    this.conversationSubscription = this.chatService.conversations$.subscribe(() => {
      if (this.activeChat) {
        this.loadMessages(this.activeChat.uid);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.conversationSubscription?.unsubscribe();
  }

  getAvatarUrl(user: UserWithOnlineStatus): string {
    return user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
  }

  getCurrentUserAvatar(): string {
    if (this.currentUser) {
      return this.getAvatarUrl(this.currentUser);
    }
    return 'assets/img/avatars/1.jpg';
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    const currentValue = this.replyCtrl.value || '';
    this.replyCtrl.setValue(currentValue + emoji);
    this.showEmojiPicker = false;
  }

  selectUser(user: UserWithOnlineStatus) {
    this.activeChat = user;
    this.showContacts = false;
    this.loadMessages(user.uid);
    this.chatService.markAsRead(user.uid);
  }

  loadMessages(userId: string) {
    this.messages = this.chatService.getMessages(userId);
    this.shouldScrollToBottom = true;
  }

  send() {
    if (this.replyCtrl.value && this.activeChat) {
      const message = this.replyCtrl.value.trim();
      if (!message) return;
      
      // Agregar mensaje localmente
      this.chatService.addMessage(this.currentUserId, this.activeChat.uid, message, true);
      
      // Enviar al servidor
      this.notificationServer.send({
        type: 'chat_message',
        to: this.activeChat.uid,
        message: message
      });
      
      this.replyCtrl.reset();
      this.shouldScrollToBottom = true;
    }
  }

  private scrollToBottom() {
    if (this.messagesScroll?.scrollbarRef) {
      setTimeout(() => {
        const scrollElement = this.messagesScroll.scrollbarRef.getScrollElement();
        scrollElement.scrollTo(0, scrollElement.scrollHeight);
      }, 10);
    }
  }

  closeChat() {
    this.chatSidenavService.close();
  }
}
