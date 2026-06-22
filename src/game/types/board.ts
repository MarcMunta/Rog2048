export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  row: number;
  col: number;
}

export interface BoardTile {
  id: string;
  value: number;
  lockedTurns: number;
  cursed: boolean;
}

export type BoardCell = BoardTile | null;

export interface BoardState {
  size: number;
  cells: BoardCell[];
  nextId: number;
  spawnPreview: number[];
}

export interface TileMovement {
  id: string;
  value: number;
  from: Position;
  to: Position;
  kind: 'move' | 'merge-source';
}

export interface MergeEvent {
  value: number;
  position: Position;
  sourceIds: string[];
  createdTile: BoardTile;
  cursed: boolean;
}

export interface SpawnEvent {
  tile: BoardTile;
  position: Position;
}

export interface BoardMoveResult {
  moved: boolean;
  direction: Direction;
  movements: TileMovement[];
  merges: MergeEvent[];
  spawns: SpawnEvent[];
  unlockedTiles: number;
  noMovesAfter: boolean;
}
