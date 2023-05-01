import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  constructor(private http: HttpClient) {}

  registerUser(email: string, password: string) {
    this.http
      .post<{ message: string }>('http://localhost:3000/register', {
        email,
        password,
      })
      .subscribe((responseData) => console.log(responseData.message));
  }

  loginUser(email: string, password: string) {
    this.http
      .post<{ message: string }>('http://localhost:3000/login', {
        email,
        password,
      })
      .subscribe((responseData) => console.log(responseData.message));
  }
}
