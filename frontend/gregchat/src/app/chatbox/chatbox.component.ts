import { Component, Input, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Chatroom, User } from '../chatlist/chatlist.component';

interface Message {
  to: string;
  from: string;
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements OnInit {
  currentUser: User | null = null;
  messageText = '';
  messages: Message[] = [];

  @Input() chatroom: Chatroom | null = null;

  constructor(private socket: Socket) {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  ngOnInit() {
    console.log(this.chatroom);
    if (this.chatroom) {
      this.getMessages();
      this.listenForUpdates();
    }
  }

  getMessages() {
    this.socket.emit('get-messages', this.chatroom?.chatId);
    this.socket.fromEvent<Message[]>('messages').subscribe((messages) => {
      this.messages = messages;
    });
  }

  listenForUpdates() {
    this.socket.fromEvent<Message>('message').subscribe((message) => {
      if (message.to === this.currentUser?._id) {
        this.messages.push(message);
      }
    });
  }

  sendMessage() {
    if (this.messageText && this.chatroom) {
      const message: Message = {
        to: this.getOtherUser()._id,
        from: this.currentUser?._id || '',
        message: this.messageText,
        timestamp: new Date(),
      };
      this.socket.emit('send-message', this.chatroom.chatId, message);
      this.messages.push(message);
      this.messageText = '';
    }
  }

  getOtherUser(): User {
    const otherMember = this.chatroom?.members.find(
      (member) => member.id !== this.currentUser?._id
    );
    if (otherMember) {
      return { _id: otherMember.id, username: otherMember.username };
    } else {
      return { _id: '', username: '' };
    }
  }
}
