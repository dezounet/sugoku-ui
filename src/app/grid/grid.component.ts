import { Component, OnInit } from '@angular/core';
import { GridService, Cell } from '../grid.service';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css'],
  providers: [GridService]
})
export class GridComponent implements OnInit {

  size = 9;
  locked = false;
  loading = true;
  uuid: string;
  grid: Cell[][] = [];

  constructor(private gridService: GridService) {
    // initialize grid
    for (let i = 0; i < this.size; i++) {
      this.grid.push([]);
      for (let j = 0; j < this.size; j++) {
        this.grid[i].push({
          uuid: null,
          row: i,
          column: j,
          value: 0,
          frozen: false
        });
      }
    }
  }

  ngOnInit(): void {
    // Subscribe to service events
    this.gridService.updateEvent.subscribe(msg => {
      if (msg.uuid !== this.uuid) {
        // reset grid because we are out of sync
        this.getGridFromServer();
      } else {
        // update cell
        this.update(msg.row, msg.column, msg);
      }
    });

    this.gridService.resetEvent.subscribe(msg => {
      this.getGridFromServer();
    });

    // Get grid to initialize app
    this.getGridFromServer();
  }

  private getGridFromServer(): void {
    this.loading = true;

    this.gridService.getGrid().subscribe(data => {
      this.updateGrid(data);
      this.loading = false;
    });
  }

  private updateGrid(data): void {
    this.uuid = data.uuid;

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const cell = data.cells[i][j];

        if (isNaN(cell.value)) {
          cell.value = null;
        }

        if (isNaN(cell.frozen)) {
          cell.frozen = false;
        }

        if (isNaN(cell.uuid)) {
          cell.uuid = this.uuid;
        }

        this.update(i, j, cell);
      }
    }

    this.locked = false;
    if (this.isSolved()) {
      this.locked = true;
    }
  }

  onClick(row: number, column: number, cell: Cell): void {
    if (!this.locked) {
      if (cell.value === null) {
        cell.value = 0;
      }

      cell.value = cell.value % 9 + 1;

      if (this.isSolved()) {
        this.locked = true;
      }

      this.sync(row, column, cell.value);
    }
  }

  resetCell(row: number, column: number, cell: Cell): void {
    if (!this.locked) {
      cell.value = null;
      this.sync(row, column, cell.value);
    }
  }

  sync(row: number, column: number, value: number): void {
    this.gridService.updateCell(this.grid[row][column]);
  }

  update(row: number, column: number, cell: Cell): void {
    if (cell.value === 0) {
      cell.value = null;
    }

    this.grid[row][column] = cell;

    if (this.isSolved()) {
      this.locked = true;
    }
  }

  isRowValid(row: number): boolean {
    const counter = new Map<number, number>();
    for (let i = 0; i < this.size; i++) {
      counter.set(i + 1, 0);
    }

    for (let i = 0; i < this.size; i++) {
      const value = this.grid[row][i].value;
      counter.set(value, counter.get(value) + 1);
    }

    return !Array.from(counter.values()).some(
      (item) => {
        return item > 1;
      }
    );
  }

  isColumnValid(column: number): boolean {
    const counter = new Map<number, number>();
    for (let i = 0; i < this.size; i++) {
      counter.set(i + 1, 0);
    }

    for (let i = 0; i < this.size; i++) {
      const value = this.grid[i][column].value;
      counter.set(value, counter.get(value) + 1);
    }

    return !Array.from(counter.values()).some(
      (item) => {
        return item > 1;
      }
    );
  }

  isBoxValid(row: number, column: number): boolean {
    const counter = new Map<number, number>();
    for (let i = 0; i < this.size; i++) {
      counter.set(i + 1, 0);
    }

    const boxRow = Math.floor(row / 3);
    const columnRow = Math.floor(column / 3);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const value = this.grid[3 * boxRow + i][3 * columnRow + j].value;
        counter.set(value, counter.get(value) + 1);
      }
    }

    return !Array.from(counter.values()).some(
      (item) => {
        return item > 1;
      }
    );
  }

  isFrozen(row: number, column: number): boolean {
    if (this.grid[row][column].frozen) {
      return true;
    }
    else {
      return false;
    }
  }

  isSolved(): boolean {
    // if grid is empty, module not initialized yet
    if (this.grid.length === 0) {
      return false;
    }

    for (let i = 0; i < this.size; i++) {
      // Check row or column is valid
      if (!this.isRowValid(i) ||
          !this.isColumnValid(i)) {
        return false;
      }

      for (let j = 0; j < this.size; j++) {
        // check value of cell is not empty
        if (this.grid[i][j].value === null) {
          return false;
        }

        // check box is valid
        if ((i % 3) === 0 && (j % 3) === 0 && !this.isBoxValid(i, j)) {
          return false;
        }
      }
    }

    return true;
  }

  onDifficultyButtonClick(difficulty: string): void {
    this.gridService.resetGrid(difficulty).subscribe(data => {
      this.getGridFromServer();
    });
  }
}
