import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';

export interface Chatroom {
  chatId: string;
  members: { id: string; username: string }[];
  messages: { to: string; from: string; message: string; timestamp: Date }[];
}

export interface User {
  _id: string;
  username: string;
}

@Component({
  selector: 'app-chatlist',
  templateUrl: './chatlist.component.html',
  styleUrls: ['./chatlist.component.scss'],
})
export class ChatListComponent implements OnInit {
  currentUser: User | null = null;
  chatrooms: Chatroom[] = [];
  selectedChatroom: Chatroom | null = null;

  @Output() chatroomSelected = new EventEmitter<Chatroom>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private socket: Socket
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.getChatrooms();
    this.listenForUpdates();
  }

  getChatrooms() {
    this.http
      .get<{ message: string; chatrooms: Chatroom[] }>(
        `http://localhost:3000/chatrooms/${this.currentUser?._id}`
      )
      .subscribe((response) => {
        console.log(response);
        this.chatrooms = response.chatrooms.sort((a, b) => {
          // Sort chatrooms by most recent message
          const aTimestamp =
            a.messages.length > 0
              ? a.messages[a.messages.length - 1].timestamp
              : new Date(0);
          const bTimestamp =
            b.messages.length > 0
              ? b.messages[b.messages.length - 1].timestamp
              : new Date(0);
          return bTimestamp.getTime() - aTimestamp.getTime();
        });
      });
  }

  listenForUpdates() {
    this.socket.fromEvent<string>('chatroom-created').subscribe((chatId) => {
      this.getChatrooms();
    });
  }

  getOtherUser(chatroom: Chatroom): User | null {
    const otherMember = chatroom.members.find(
      (member) => member.id !== this.currentUser?._id
    );
    if (otherMember) {
      return { _id: otherMember.id, username: otherMember.username };
      console.log(otherMember);
    } else {
      return null;
    }
  }

  onSelect(chatroom: Chatroom) {
    this.selectedChatroom = chatroom;
    this.chatroomSelected.emit(chatroom);
  }
}
