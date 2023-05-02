import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Chatroom } from '../chatlist/chatlist.component';

import io from 'socket.io-client';

interface Chatbox {
  recipient: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @Input() selectedUser: string = '';
  selectedChatroom: Chatroom | null = null;
  chatboxes: Chatbox[] = [];
  editProfile = false;

  active = false;
  public profilePic: string;
  public username: string;
  public userId: string;

  user = '';
  profPic = '';
  loginError = '';

  private socket: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private http: HttpClient
  ) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.profilePic = currentUser.profilePicture;
    this.username = currentUser.username;
    this.userId = currentUser._id;

    // Connect to Socket.IO server
    this.socket = io('http://localhost:3000');

    // Emit a user-connected event to the server with the user's information
    this.socket.emit('user-connected', {
      id: this.userId,
      username: this.username,
    });

    // Listen for user-list event from the server and update the user list
    this.socket.on('user-list', (users: any[]) => {
      console.log(users);
      // Filter the user list to include only active users
      const activeUsers = users.filter((user) => user.online === true);
      console.log(activeUsers);
      // Update the user list in local storage
      localStorage.setItem('users', JSON.stringify(activeUsers));
    });
  }

  ngOnInit(): void {
    this.http.get<any>(`http://localhost:3000/users/${this.userId}`).subscribe(
      (response) => {
        console.log(response); // log response for debugging purposes
        if (response.success) {
          // store user information in local storage as currentUser
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        } else {
          // show error message returned by API
          console.error(response.message);
        }
      },
      (error) => {
        console.error(error); // log error for debugging purposes
        // show generic error message
        console.error('An error occurred while fetching user information');
      }
    );
  }

  logout() {
    // Emit a user-disconnected event to the server with the user's information
    this.socket.emit('user-disconnected', {
      id: this.userId,
      username: this.username,
    });

    // perform the logout operation
    this.authService.logout().subscribe(
      () => {
        // clear user info from local storage on success
        localStorage.clear();
        // navigate to login page
        this.router.navigate(['']);
        // show success message
        this.toastr.success('Logout successful');
      },
      (error) => {
        console.error(error);
      }
    );
  }

  public onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.profPic = reader.result as string;
      console.log(this.profPic);
    };
  }

  onSubmit() {
    const url = `http://localhost:3000/users/${
      JSON.parse(localStorage.getItem('currentUser') || '{}')._id
    }`; // replace with your API endpoint
    const body = {
      username: this.user,
      profilePicture: this.profPic,
    };
    console.log(body);

    this.http.put<any>(url, body).subscribe(
      (response) => {
        console.log(response); // log response for debugging purposes
        if (response.success) {
          this.loginError = ''; // clear any previous error message
          alert('Update successful!'); // show success message
        } else {
          this.loginError = response.message; // show error message returned by API
        }
      },
      (error) => {
        console.error(error); // log error for debugging purposes
        this.loginError = 'An error occurred during update. Please try again.'; // show generic error message
      }
    );
  }

  cancel(data: any) {
    this.editProfile = data;
  }

  addChatbox(recipient: string) {
    this.chatboxes.push({ recipient });
  }

  showActive(data: any) {
    this.active = data;
  }

  onStartChatting(user: any) {
    const chatbox = {
      recipient: user.username,
    };
    this.chatboxes.push(chatbox);
  }

  onSelect(user: any) {
    this.onStartChatting(user);
  }

  onChatroomSelected(chatroom: Chatroom) {
    this.selectedChatroom = chatroom;
  }
}
