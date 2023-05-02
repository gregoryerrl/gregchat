import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  editProfile = false;
  public profilePic: string;
  public username: string;
  public userId: string;

  user = '';
  profPic = '';
  loginError = '';

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
}