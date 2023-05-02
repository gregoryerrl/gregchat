import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';

interface User {
  _id: string;
  username: string;
  profilePicture: string;
  online: boolean;
}

@Component({
  selector: 'app-active-users',
  templateUrl: './active-users.component.html',
  styleUrls: ['./active-users.component.scss'],
})
export class ActiveUsersComponent implements OnInit {
  @Output() chatSelected = new EventEmitter<any>();

  users: User[] = [];
  selectedUser: User | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private socket: Socket // inject the Socket service
  ) {}

  ngOnInit() {
    this.refreshUsers();
    this.listenForUpdates();
  }

  refreshUsers() {
    this.users = [];
    this.http
      .get<{ message: string; users: User[] }>(
        'http://localhost:3000/activeusers'
      )
      .subscribe((response) => {
        // Filter the user list to include only active users
        this.users = response.users.filter((user) => user.online === true);
        this.cdr.detectChanges(); // manually trigger change detection
      });
  }

  listenForUpdates() {
    // Listen for updates to the user list
    this.socket.fromEvent<User[]>('user-list').subscribe((users) => {
      // Filter the user list to include only active users
      this.users = users.filter((user) => user.online === true);
      this.cdr.detectChanges(); // manually trigger change detection
    });
  }

  onSelect(user: User) {
    this.selectedUser = user;
  }

  onChat(user: User) {
    console.log(user);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const from = { id: currentUser._id, username: currentUser.username };
    const to = { id: user._id, username: user.username };
    console.log('From:', from);
    console.log('To:', to);
    if (to) {
      this.socket.emit('create-chatroom', { from, to });
      this.chatSelected.emit(user);
    }
  }
}
