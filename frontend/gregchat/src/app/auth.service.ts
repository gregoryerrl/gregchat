import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}login`, {
      username: username,
      password: password,
    });
  }

  logout() {
    return this.http.get(`${this.apiUrl}logout`).pipe(
      tap(() => {
        localStorage.clear();
      })
    );
  }

  isLoggedIn() {
    // Check if the user is currently logged in (e.g. by checking for a JWT in local storage)
  }
}
