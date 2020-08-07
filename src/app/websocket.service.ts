import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import ReconnectingWebSocket from 'reconnecting-websocket';

import { BACKEND_ADDRESS, WEBSOCKET_PROTOCOL } from './const';
import { UuidService } from './uuid.service';

// Make the function wait until the connection is made...
function waitForSocketConnection(socket, callback): void {
  setTimeout(
      () => {
          if (socket.readyState === WebSocket.OPEN) {
              if (callback != null){
                  callback();
              }
          } else {
              waitForSocketConnection(socket, callback);
          }
      }, 5); // wait 5 milisecond for the connection...
}

export interface Channel {
  receiver: Subject<Message>;
  sender: Observer<Message>;
}

export interface Message {
  event: string;
  // tslint:disable-next-line: ban-types
  data: Object;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  static ENDPOINT = '/websocket';
  static UUIDKEY = 'websocket';

  public uuid: string;
  public channel: Channel;

  constructor(uuidService: UuidService) {
    this.uuid = uuidService.get(WebsocketService.UUIDKEY);
    const url = WEBSOCKET_PROTOCOL + '://' + BACKEND_ADDRESS + WebsocketService.ENDPOINT + '?uuid=' + this.uuid;

    this.channel = this.connect(url);
  }

  public getUuid(): string {
    return this.uuid;
  }

  private connect(url: string): Channel {
    const socket = new ReconnectingWebSocket(url);
    const receiver = new Subject<Message>();

    socket.onmessage = (msgEvent: MessageEvent) => {
      console.log('Receiving message in websocket service');
      const data = JSON.parse(msgEvent.data);
      receiver.next({
        event: data.event,
        data: data.data,
      });
    };

    const observer = {
      next: (data: Message) => {
        this.send(socket, data);
      }
    } as Observer<Message>;

    return {
      receiver,
      sender: observer
    };
  }

  private send(socket: ReconnectingWebSocket, data: Message): void {
    waitForSocketConnection(socket, () => {
      socket.send(JSON.stringify(data));
    });
  }
}
