import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { PROTOCOL, BACKEND_ADDRESS } from './const';

export interface User {
  uuid: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  static REST_ENDPOINT = '/users';

  static ADD_EVENT = 'user-del';
  static UPDATE_EVENT = 'user-update';
  static DELETE_EVENT = 'user-del';

  public addEvent = new Subject<User>();
  public updateEvent = new Subject<User>();
  public deleteEvent = new Subject<User>();

  constructor(private websocket: WebsocketService, private http: HttpClient) {
    this.websocket.channel.receiver.subscribe((msg) => {
      const data = msg.data as User;
      if (msg.event === UserService.ADD_EVENT) {
        this.addEvent.next({uuid: data.uuid, name: data.name});
      } else if (msg.event === UserService.DELETE_EVENT) {
        this.deleteEvent.next({uuid: data.uuid, name: data.name});
      } else if (msg.event === UserService.UPDATE_EVENT) {
        this.updateEvent.next({uuid: data.uuid, name: data.name});
      }
    });
  }

  public get(): Observable<Map<string, string>> {
    // Get user list from server
    const promise = this.http.get(PROTOCOL + '://' + BACKEND_ADDRESS + UserService.REST_ENDPOINT);

    // Convert it to a map and return this new observable
    const users = promise.pipe(map(
      (userList: User[]) => {
        return new Map(userList.map(i => [i.uuid, i.name]));
      }
    )) as Observable<Map<string, string>>;

    return users;
  }

  public updateUsername(username: string): void {
    const message = {
      event: UserService.UPDATE_EVENT,
      data: {
        uuid: this.getUuid(),
        name: username
      }
    };

    this.websocket.channel.sender.next(message);
  }

  public getUuid(): string {
    return this.websocket.getUuid();
  }
}
