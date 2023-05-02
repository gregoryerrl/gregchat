import { Component, Input } from '@angular/core';
import { Socket } from 'ngx-socket-io';

interface Message {
  from: string;
  to: string;
  message: string;
}

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent {
  @Input() recipient!: string;
  messages: Message[] = [];

  constructor(private socket: Socket) {}

  sendMessage(message: string) {
    const from = 'current user'; // replace with actual current user
    const to = this.recipient;
    const data: Message = { from, to, message };
    this.socket.emit('private-message', data);
    this.messages.push(data);
  }

  ngOnInit() {
    this.socket.fromEvent<Message>('private-message').subscribe((message) => {
      if (message.to === this.recipient) {
        this.messages.push(message);
      }
    });
  }
}
