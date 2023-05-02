import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  username = '';
  password = '';
  loginError = '';

  constructor(private http: HttpClient) {}

  onSignUp() {
    console.log(`Username: ${this.username}, Password: ${this.password}`);
    const url = 'http://localhost:3000/register'; // replace with your API endpoint
    const body = {
      username: this.username,
      password: this.password,
    };
    console.log(body);

    this.http.post<any>(url, body).subscribe(
      (response) => {
        console.log(response); // log response for debugging purposes
        if (response.success) {
          this.loginError = ''; // clear any previous error message
          alert('Register successful!'); // show success message
        } else {
          this.loginError = response.message; // show error message returned by API
        }
      },
      (error) => {
        console.error(error); // log error for debugging purposes
        this.loginError = 'An error occurred during login. Please try again.'; // show generic error message
      }
    );
  }
}
