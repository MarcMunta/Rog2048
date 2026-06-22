import type {
  BoardMoveResult,
  BoardState,
  BoardTile,
  Direction,
  MergeEvent,
  Position,
  SpawnEvent,
  TileMovement
} from '../types/board';
import { Random } from '../utils/random';

export interface SpawnOptions {
  poorSpawns?: boolean;
  betterPreview?: boolean;
  cursedFours?: boolean;
}

export class BoardSystem {
  static create(size = 4, rng = new Random(), options: SpawnOptions = {}): BoardState {
    const state: BoardState = {
      size,
      cells: Array.from({ length: size * size }, () => null),
      nextId: 1,
      spawnPreview: []
    };
    this.ensurePreview(state, rng, options);
    this.addRandomTile(state, rng, options);
    this.addRandomTile(state, rng, options);
    return state;
  }

  static positionToIndex(state: BoardState, position: Position): number {
    return position.row * state.size + position.col;
  }

  static indexToPosition(state: BoardState, index: number): Position {
    return {
      row: Math.floor(index / state.size),
      col: index % state.size
    };
  }

  static tileAt(state: BoardState, position: Position): BoardTile | null {
    if (!this.inBounds(state, position)) return null;
    return state.cells[this.positionToIndex(state, position)];
  }

  static setTile(state: BoardState, position: Position, tile: BoardTile | null): void {
    if (!this.inBounds(state, position)) return;
    state.cells[this.positionToIndex(state, position)] = tile;
  }

  static inBounds(state: BoardState, position: Position): boolean {
    return position.row >= 0 && position.col >= 0 && position.row < state.size && position.col < state.size;
  }

  static move(
    state: BoardState,
    direction: Direction,
    rng = new Random(),
    options: SpawnOptions & { spawn?: boolean } = {}
  ): BoardMoveResult {
    const oldCells = state.cells;
    const nextCells = Array.from({ length: state.size * state.size }, () => null as BoardTile | null);
    const movements: TileMovement[] = [];
    const merges: MergeEvent[] = [];
    let moved = false;

    const processSegment = (indices: number[]) => {
      const sources = indices
        .map((index) => ({ index, tile: oldCells[index] }))
        .filter((entry): entry is { index: number; tile: BoardTile } => entry.tile !== null);

      const outputs: Array<{ tile: BoardTile; sourceIndices: number[]; merged: boolean; cursed: boolean }> = [];
      for (let i = 0; i < sources.length; i += 1) {
        const current = sources[i];
        const next = sources[i + 1];
        if (next && current.tile.value === next.tile.value) {
          const created = this.createTile(state, current.tile.value * 2, false);
          outputs.push({
            tile: created,
            sourceIndices: [current.index, next.index],
            merged: true,
            cursed: current.tile.cursed || next.tile.cursed
          });
          i += 1;
          moved = true;
        } else {
          outputs.push({
            tile: { ...current.tile },
            sourceIndices: [current.index],
            merged: false,
            cursed: current.tile.cursed
          });
        }
      }

      outputs.forEach((output, outputIndex) => {
        const destinationIndex = indices[outputIndex];
        const destination = this.indexToPosition(state, destinationIndex);
        nextCells[destinationIndex] = output.tile;

        if (output.merged) {
          movements.push(
            ...output.sourceIndices.map((sourceIndex) => ({
              id: oldCells[sourceIndex]!.id,
              value: oldCells[sourceIndex]!.value,
              from: this.indexToPosition(state, sourceIndex),
              to: destination,
              kind: 'merge-source' as const
            }))
          );
          merges.push({
            value: output.tile.value,
            position: destination,
            sourceIds: output.sourceIndices.map((sourceIndex) => oldCells[sourceIndex]!.id),
            createdTile: output.tile,
            cursed: output.cursed
          });
        } else {
          const sourceIndex = output.sourceIndices[0];
          if (sourceIndex !== destinationIndex) moved = true;
          movements.push({
            id: output.tile.id,
            value: output.tile.value,
            from: this.indexToPosition(state, sourceIndex),
            to: destination,
            kind: 'move'
          });
        }
      });
    };

    for (const line of this.linesForDirection(state, direction)) {
      let segment: number[] = [];
      const flush = () => {
        if (segment.length > 0) processSegment(segment);
        segment = [];
      };

      for (const index of line) {
        const tile = oldCells[index];
        if (tile && tile.lockedTurns > 0) {
          flush();
          nextCells[index] = { ...tile };
        } else {
          segment.push(index);
        }
      }
      flush();
    }

    const spawns: SpawnEvent[] = [];
    if (moved) {
      state.cells = nextCells;
      if (options.spawn !== false) {
        const spawn = this.addRandomTile(state, rng, options);
        if (spawn) spawns.push(spawn);
      }
    }

    const unlockedTiles = moved ? this.tickLocks(state) : 0;

    return {
      moved,
      direction,
      movements,
      merges,
      spawns,
      unlockedTiles,
      noMovesAfter: !this.hasValidMoves(state)
    };
  }

  static addRandomTile(state: BoardState, rng = new Random(), options: SpawnOptions = {}): SpawnEvent | null {
    const empty = this.emptyPositions(state);
    if (empty.length === 0) return null;
    this.ensurePreview(state, rng, options);
    const position = rng.pick(empty);
    const value = state.spawnPreview.shift() ?? this.rollSpawnValue(rng, options);
    this.ensurePreview(state, rng, options);
    const cursed = Boolean(options.cursedFours && value === 4 && rng.chance(0.35));
    const tile = this.createTile(state, value, cursed);
    this.setTile(state, position, tile);
    return { tile, position };
  }

  static ensurePreview(state: BoardState, rng = new Random(), options: SpawnOptions = {}): void {
    while (state.spawnPreview.length < 3) {
      state.spawnPreview.push(this.rollSpawnValue(rng, options));
    }
  }

  static setPreview(state: BoardState, values: number[]): void {
    state.spawnPreview = values.slice(0, 3);
  }

  static rollSpawnValue(rng = new Random(), options: SpawnOptions = {}): number {
    if (options.poorSpawns) {
      return rng.weighted([
        { item: 2, weight: 90 },
        { item: 4, weight: 10 }
      ]);
    }
    if (options.betterPreview) {
      return rng.weighted([
        { item: 2, weight: 52 },
        { item: 4, weight: 36 },
        { item: 8, weight: 12 }
      ]);
    }
    return rng.weighted([
      { item: 2, weight: 72 },
      { item: 4, weight: 24 },
      { item: 8, weight: 4 }
    ]);
  }

  static hasValidMoves(state: BoardState): boolean {
    if (this.emptyPositions(state).length > 0) return true;
    for (let row = 0; row < state.size; row += 1) {
      for (let col = 0; col < state.size; col += 1) {
        const tile = this.tileAt(state, { row, col });
        if (!tile || tile.lockedTurns > 0) continue;
        const right = this.tileAt(state, { row, col: col + 1 });
        const down = this.tileAt(state, { row: row + 1, col });
        if (right && right.lockedTurns === 0 && right.value === tile.value) return true;
        if (down && down.lockedTurns === 0 && down.value === tile.value) return true;
      }
    }
    return false;
  }

  static compressToCenter(state: BoardState): BoardMoveResult {
    const center = (state.size - 1) / 2;
    const destinations = Array.from({ length: state.size * state.size }, (_, index) => index)
      .filter((index) => {
        const tile = state.cells[index];
        return !tile || tile.lockedTurns === 0;
      })
      .sort((a, b) => {
        const pa = this.indexToPosition(state, a);
        const pb = this.indexToPosition(state, b);
        const da = Math.abs(pa.row - center) + Math.abs(pa.col - center);
        const db = Math.abs(pb.row - center) + Math.abs(pb.col - center);
        return da - db;
      });
    const movable = state.cells
      .map((tile, index) => ({ tile, index }))
      .filter((entry): entry is { tile: BoardTile; index: number } => entry.tile !== null && entry.tile.lockedTurns === 0);
    const nextCells = state.cells.map((tile) => (tile && tile.lockedTurns > 0 ? { ...tile } : null));
    const movements: TileMovement[] = [];
    let moved = false;

    movable.forEach((entry, slot) => {
      const destinationIndex = destinations[slot];
      const tile = { ...entry.tile };
      nextCells[destinationIndex] = tile;
      if (entry.index !== destinationIndex) moved = true;
      movements.push({
        id: tile.id,
        value: tile.value,
        from: this.indexToPosition(state, entry.index),
        to: this.indexToPosition(state, destinationIndex),
        kind: 'move'
      });
    });

    state.cells = nextCells;
    return {
      moved,
      direction: 'up',
      movements,
      merges: [],
      spawns: [],
      unlockedTiles: 0,
      noMovesAfter: !this.hasValidMoves(state)
    };
  }

  static upgradeTile(state: BoardState, position: Position, steps = 1): BoardTile | null {
    const tile = this.tileAt(state, position);
    if (!tile || tile.lockedTurns > 0) return null;
    tile.value *= 2 ** steps;
    tile.cursed = false;
    return tile;
  }

  static removeTile(state: BoardState, position: Position): BoardTile | null {
    const tile = this.tileAt(state, position);
    if (!tile || tile.lockedTurns > 0) return null;
    this.setTile(state, position, null);
    return tile;
  }

  static duplicateTile(state: BoardState, position: Position, rng = new Random()): SpawnEvent | null {
    const source = this.tileAt(state, position);
    if (!source || source.lockedTurns > 0 || source.value > 32) return null;
    const empty = this.emptyPositions(state);
    if (empty.length === 0) return null;
    const target = rng.pick(empty);
    const tile = this.createTile(state, source.value, source.cursed);
    this.setTile(state, target, tile);
    return { tile, position: target };
  }

  static freezeTile(state: BoardState, position: Position, turns = 2): BoardTile | null {
    const tile = this.tileAt(state, position);
    if (!tile) return null;
    tile.lockedTurns = Math.max(tile.lockedTurns, turns);
    return tile;
  }

  static forceMergePair(state: BoardState): MergeEvent | null {
    const entries = state.cells
      .map((tile, index) => ({ tile, index }))
      .filter((entry): entry is { tile: BoardTile; index: number } => entry.tile !== null && entry.tile.lockedTurns === 0);
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        if (entries[i].tile.value !== entries[j].tile.value) continue;
        const created = this.createTile(state, entries[i].tile.value * 2, false);
        const position = this.indexToPosition(state, entries[i].index);
        const cursed = entries[i].tile.cursed || entries[j].tile.cursed;
        state.cells[entries[i].index] = created;
        state.cells[entries[j].index] = null;
        return {
          value: created.value,
          position,
          sourceIds: [entries[i].tile.id, entries[j].tile.id],
          createdTile: created,
          cursed
        };
      }
    }
    return null;
  }

  static lockRandomTile(state: BoardState, rng = new Random(), turns = 2): Position | null {
    const candidates = this.occupiedPositions(state).filter((position) => {
      const tile = this.tileAt(state, position);
      return tile !== null && tile.lockedTurns === 0;
    });
    if (candidates.length === 0) return null;
    const position = rng.pick(candidates);
    this.freezeTile(state, position, turns);
    return position;
  }

  static curseRandomTile(state: BoardState, rng = new Random()): Position | null {
    const candidates = this.occupiedPositions(state).filter((position) => {
      const tile = this.tileAt(state, position);
      return tile !== null && !tile.cursed;
    });
    if (candidates.length === 0) return null;
    const position = rng.pick(candidates);
    const tile = this.tileAt(state, position);
    if (tile) tile.cursed = true;
    return position;
  }

  static removeRandomTile(state: BoardState, rng = new Random()): Position | null {
    const candidates = this.occupiedPositions(state).filter((position) => {
      const tile = this.tileAt(state, position);
      return tile !== null && tile.lockedTurns === 0;
    });
    if (candidates.length === 0) return null;
    const position = rng.pick(candidates);
    this.setTile(state, position, null);
    return position;
  }

  static occupiedPositions(state: BoardState): Position[] {
    return state.cells
      .map((tile, index) => (tile ? this.indexToPosition(state, index) : null))
      .filter((position): position is Position => position !== null);
  }

  static emptyPositions(state: BoardState): Position[] {
    return state.cells
      .map((tile, index) => (tile ? null : this.indexToPosition(state, index)))
      .filter((position): position is Position => position !== null);
  }

  static highestTile(state: BoardState): number {
    return Math.max(0, ...state.cells.map((tile) => tile?.value ?? 0));
  }

  static tickLocks(state: BoardState): number {
    let unlocked = 0;
    state.cells.forEach((tile) => {
      if (!tile || tile.lockedTurns <= 0) return;
      tile.lockedTurns -= 1;
      if (tile.lockedTurns === 0) unlocked += 1;
    });
    return unlocked;
  }

  private static createTile(state: BoardState, value: number, cursed: boolean): BoardTile {
    const tile: BoardTile = {
      id: `t${state.nextId}`,
      value,
      lockedTurns: 0,
      cursed
    };
    state.nextId += 1;
    return tile;
  }

  private static linesForDirection(state: BoardState, direction: Direction): number[][] {
    const lines: number[][] = [];
    for (let major = 0; major < state.size; major += 1) {
      const line: number[] = [];
      for (let minor = 0; minor < state.size; minor += 1) {
        const row =
          direction === 'up' || direction === 'down'
            ? direction === 'up'
              ? minor
              : state.size - 1 - minor
            : major;
        const col =
          direction === 'left' || direction === 'right'
            ? direction === 'left'
              ? minor
              : state.size - 1 - minor
            : major;
        line.push(row * state.size + col);
      }
      lines.push(line);
    }
    return lines;
  }
}
