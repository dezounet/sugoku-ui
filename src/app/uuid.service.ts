import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UuidService {

  private uuids = new Map<string, string>();

  public get(key: string): string {
    const internalKey = this.keyfication(key);
    let uuid = this.uuids.get(internalKey);

    if (uuid === undefined) {
      uuid = localStorage.getItem(internalKey);
      if (uuid === null) {
        uuid = uuidv4();
        this.uuids.set(internalKey, uuid);
        localStorage.setItem(internalKey, uuid);
      }
    }

    return uuid;
  }

  private keyfication(key: string): string {
    return 'uuid_' + key;
  }
}
