import { Component, OnInit, Inject } from '@angular/core';

import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { MatDialog } from '@angular/material/dialog';

import { User, UserService } from '../user.service';
import { UsernameComponent } from '../username/username.component';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  maxUsers = 5;
  users = new Map<string, string>();
  localUser: User;

  constructor(private userService: UserService, public dialog: MatDialog) {}

  ngOnInit(): void {
    // Get already connected user list
    this.updateUsers();

    // Get local user name and sync it with the server
    this.setLocalUsername();

    // Subscribe to events from server
    this.userService.addEvent.subscribe(user => {
      this.users.set(user.uuid, user.name);
    });

    this.userService.updateEvent.subscribe(user => {
      this.users.set(user.uuid, user.name);
    });

    this.userService.deleteEvent.subscribe(user => {
      this.users.delete(user.uuid);
    });
  }

  private updateUsers(): void {
    this.userService.get().subscribe(data => {
      this.users = new Map<string, string>();
      data.forEach((value: string, key: string) => {
        this.users.set(key, value);
      });
    });
  }

  private setLocalUsername(): void {
    // Get local username from local storage
    let name = localStorage.getItem('username');
    if (name === null) {
      // Generate a random username if there is none
      name =  uniqueNamesGenerator({
        dictionaries: [colors, adjectives, animals],
        separator: ' ',
        style: 'capital',
      });
    }

    this.localUser = {
      uuid: this.userService.getUuid(),
      name
    };

    this.syncLocalUsername();
  }

  private syncLocalUsername(): void {
    // Store this new username in the local storage
    localStorage.setItem('username', this.localUser.name);

    // Sync name with other users
    this.userService.updateUsername(this.localUser.name);
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UsernameComponent, {
      width: '350px',
      data: {username: this.localUser.name},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.localUser = {
          uuid: this.userService.getUuid(),
          name: result
        };

        this.syncLocalUsername();
      }
    });
  }
}
