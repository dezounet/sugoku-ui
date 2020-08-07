import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { PROTOCOL, BACKEND_ADDRESS } from './const';

export interface Cell {
  uuid: string;
  row: number;
  column: number;
  value: number;
  frozen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GridService {
  static REST_ENDPOINT = '/grid';

  static UPDATE_EVENT = 'grid-update';
  static RESET_EVENT = 'grid-reset';

  public updateEvent = new Subject<Cell>();
  public resetEvent = new Subject<boolean>();

  constructor(private websocket: WebsocketService, private http: HttpClient) {
    this.websocket.channel.receiver.subscribe((msg) => {
      if (msg.event === GridService.UPDATE_EVENT) {
        const data = msg.data as Cell;
        this.updateEvent.next({
          uuid: data.uuid,
          row: data.row,
          column: data.column,
          value: data.value,
          frozen: data.frozen,
        });
      } else if (msg.event === GridService.RESET_EVENT) {
        this.resetEvent.next(true);
      }
    });
  }

  public getGrid(): Observable<Object> {
    const grid = this.http.get(PROTOCOL + '://' + BACKEND_ADDRESS + GridService.REST_ENDPOINT);
    return grid;
  }

  public resetGrid(difficulty: string): Observable<Object> {
    const grid = this.http.get(PROTOCOL + '://' + BACKEND_ADDRESS + GridService.REST_ENDPOINT + '/reset?difficulty=' + difficulty);
    return grid;
  }

  public updateCell(cell: Cell): void {
    const message = {
      event: GridService.UPDATE_EVENT,
      data: {
        uuid: cell.uuid,
        row: cell.row,
        column: cell.column,
        value: cell.value,
      }
    };

    this.websocket.channel.sender.next(message);
  }
}
