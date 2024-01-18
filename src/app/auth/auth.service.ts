import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthData } from './auth-data.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token = '';
  private loginStatus = new BehaviorSubject<boolean>(false);
  private clearTimer: NodeJS.Timeout;

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getLoginStatus() {
    return this.loginStatus.asObservable();
  }

  register(email: string, password: string) {
    const authData: AuthData = {
      email,
      password,
    };
    return this.http.post('http://localhost:3000/api/auth/register', authData);
  }

  login(email: string, password: string) {
    const authData: AuthData = {
      email,
      password,
    };
    console.log(authData);
    this.http
      .post<any>('http://localhost:3000/api/auth/login', authData)
      .subscribe({
        next: (response) => {
          this.token = response.token;
          
          if (!this.token) {
            return;
          }

          this.loginStatus.next(true);
          localStorage.setItem('tokenDetails', JSON.stringify({
            token: response.token,
            expiresIn: response.expiresIn,
            timestamp: (new Date()).toISOString()
          }));
          this.autoLogout(response.expiresIn);
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.log(err.message);
        },
      });
  }

  autoLogin(tokenData: string) {
    if (!tokenData) {
      return;
    }

    const tokenDetails = JSON.parse(tokenData);
    this.token = tokenDetails.token;
    this.loginStatus.next(true);
    let timeNow = new Date().getTime();
    let timeCreated = new Date(tokenDetails.timestamp).getTime();
    let timeElapsed = timeNow - timeCreated;

    console.log("timeNow => ", timeNow)
    console.log("timeCreated => ", timeCreated)
    console.log("timeElapsed => ", timeElapsed)
    console.log("timer => ", Number(tokenDetails.expiresIn) - timeElapsed)
    this.autoLogout(Number(tokenDetails.expiresIn) - timeElapsed);
  }

  logout() {
    clearTimeout(this.clearTimer);
    this.token = null;
    this.loginStatus.next(false);
    localStorage.removeItem('tokenDetails');
    this.router.navigate(['/']);
  }

  autoLogout(time) {
    this.clearTimer = setTimeout(() => {
      this.logout();
    }, time);
  }
}
