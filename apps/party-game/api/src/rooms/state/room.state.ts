import { Player, GameAction, GameEvent } from '../../shared/types';

export interface RoomState {
  readonly code: string;
  readonly gameType: string;
  readonly gameState: any;
  readonly players: readonly Player[];
  readonly phase: string;
  readonly hostId: string | null;
  readonly lastActivity: Date;
  readonly version: number; // For optimistic locking
}

export class ImmutableRoomState implements RoomState {
  constructor(
    public readonly code: string,
    public readonly gameType: string,
    public readonly gameState: any,
    public readonly players: readonly Player[],
    public readonly phase: string,
    public readonly hostId: string | null,
    public readonly lastActivity: Date,
    public readonly version: number = 0,
  ) {}

  // Factory method for creating new state
  static create(
    code: string,
    gameType: string,
    gameState: any,
  ): ImmutableRoomState {
    return new ImmutableRoomState(
      code,
      gameType,
      gameState,
      [],
      gameState.phase,
      null,
      new Date(),
      0,
    );
  }

  // Immutable update methods
  withPlayerAdded(player: Player): ImmutableRoomState {
    const newPlayers = [...this.players, player];
    const newHostId = this.players.length === 0 ? player.id : this.hostId;

    return new ImmutableRoomState(
      this.code,
      this.gameType,
      this.gameState,
      newPlayers,
      this.phase,
      newHostId,
      new Date(),
      this.version + 1,
    );
  }

  withPlayerRemoved(playerId: string): ImmutableRoomState {
    const newPlayers = this.players.filter((p) => p.id !== playerId);
    const newHostId =
      this.hostId === playerId
        ? newPlayers.length > 0
          ? newPlayers[0].id
          : null
        : this.hostId;

    return new ImmutableRoomState(
      this.code,
      this.gameType,
      this.gameState,
      newPlayers,
      this.phase,
      newHostId,
      new Date(),
      this.version + 1,
    );
  }

  withPlayerUpdated(
    playerId: string,
    updates: Partial<Player>,
  ): ImmutableRoomState {
    const newPlayers = this.players.map((p) =>
      p.id === playerId ? { ...p, ...updates } : p,
    );

    return new ImmutableRoomState(
      this.code,
      this.gameType,
      this.gameState,
      newPlayers,
      this.phase,
      this.hostId,
      new Date(),
      this.version + 1,
    );
  }

  withGameStateUpdated(newGameState: any): ImmutableRoomState {
    return new ImmutableRoomState(
      this.code,
      this.gameType,
      newGameState,
      this.players,
      newGameState.phase,
      this.hostId,
      new Date(),
      this.version + 1,
    );
  }

  withPhaseUpdated(newPhase: string): ImmutableRoomState {
    return new ImmutableRoomState(
      this.code,
      this.gameType,
      this.gameState,
      this.players,
      newPhase,
      this.hostId,
      new Date(),
      this.version + 1,
    );
  }

  withActivityUpdated(): ImmutableRoomState {
    return new ImmutableRoomState(
      this.code,
      this.gameType,
      this.gameState,
      this.players,
      this.phase,
      this.hostId,
      new Date(),
      this.version + 1,
    );
  }

  // Utility methods
  hasPlayer(playerId: string): boolean {
    return this.players.some((p) => p.id === playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  getConnectedPlayers(): readonly Player[] {
    return this.players.filter((p) => p.connected);
  }

  getPlayerCount(): number {
    return this.players.length;
  }

  getConnectedPlayerCount(): number {
    return this.players.filter((p) => p.connected).length;
  }

  isHost(playerId: string): boolean {
    return this.hostId === playerId;
  }

  isEmpty(): boolean {
    return this.players.length === 0;
  }

  // Deep clone for external use
  clone(): ImmutableRoomState {
    return new ImmutableRoomState(
      this.code,
      this.gameType,
      { ...this.gameState },
      this.players.map((p) => ({ ...p })),
      this.phase,
      this.hostId,
      new Date(this.lastActivity),
      this.version,
    );
  }
}
