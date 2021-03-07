import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  url = 'http://localhost:51536/api/login/authenticate';
  constructor(private http: HttpClient) {}

  authLogin(user) {
    return this.http.post(this.url, user, {
      responseType: 'text',
    });
  }

  updateUserData(id, model: { firstName: string; lastName: string }) {
    return this.http.put<{ firstName: string; lastName: string }>(
      'http://localhost:51536/api/user' + '/' + id,
      model
    );
  }

  addUser(model: { firstName: string; lastName: string }) {
    return this.http.post<{ firstName: string; lastName: string }>(
      'http://localhost:51536/api/user/createuser',
      model
    );
  }
}
