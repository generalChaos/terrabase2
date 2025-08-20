import { Room, Player, Bluff, Vote } from './state';
import { TRUE, uid, shuffle } from './utils';
import { Namespace, Socket } from 'socket.io';
import { prompts } from './prompts.seed'; // simple in-memory array for now
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';

// Local DUR config that matches the shared types
const DUR = {
  PROMPT: 15, // seconds to submit bluff
  CHOOSE: 20, // seconds to vote
  SCORING: 6, // reveal + tally
} as const;

type Choice = { id: string; by: string; text: string };

const rooms = new Map<string, Room>();

function broadcast(nsp: Namespace, room: Room) {
  nsp.emit('room', {
    code: room.code,
    phase: room.phase,
    round: room.round,
    maxRounds: room.maxRounds,
    timeLeft: room.timeLeft,
    players: room.players.map((p: Player) => ({ ...p })),
    current: room.current,
    // host-only detail events are sent separately
  });
}

function broadcastTimer(nsp: Namespace, room: Room) {
  console.log(`⏰ Broadcasting timer: ${room.timeLeft}s for room ${room.code}`);
  nsp.emit('timer', { timeLeft: room.timeLeft });
}

function tick(nsp: Namespace, room: Room, onExpire: () => void) {
  console.log(`⏰ Starting timer for room ${room.code}, timeLeft: ${room.timeLeft}`);
  
  if (room.timer) {
    console.log(`⏰ Clearing existing timer for room ${room.code}`);
    clearInterval(room.timer);
  }
  
  room.timer = setInterval(() => {
    room.timeLeft = Math.max(0, room.timeLeft - 1);
    console.log(`⏰ Timer tick for room ${room.code}: ${room.timeLeft}s remaining`);
    
    // Send timer updates every second, but only broadcast full room state occasionally
    broadcastTimer(nsp, room);
    
    if (room.timeLeft === 0) {
      console.log(`⏰ Timer expired for room ${room.code}`);
      clearInterval(room.timer);
      onExpire();
    }
  }, 1000);
  
  console.log(`⏰ Timer started for room ${room.code}`);
}

function nextPrompt(room: Room) {
  const pool = prompts.filter((p) => !room.usedPromptIds.has(p.id));
  const p = pool[(Math.random() * pool.length) | 0];
  room.usedPromptIds.add(p.id);
  room.current = {
    number: room.round,
    promptId: p.id,
    question: p.question,
    answer: p.answer,
    bluffs: [],
    votes: [],
  };
}

function toChoices(room: Room): Choice[] {
  const r = room.current!;
  const truth: Choice = { id: TRUE(r.promptId), by: 'server', text: r.answer };
  return shuffle([truth, ...r.bluffs], room.round);
}

function scoreRound(room: Room) {
  const r = room.current!;
  // +1000 for picking truth; +500 per fooled player
  const fooledCount: Record<string, number> = {};
  for (const v of r.votes) {
    if (v.choiceId.startsWith('TRUE::')) {
      const p = room.players.find((p: Player) => p.id === v.voter);
      if (p) {
        p.score += 1000;
      } else {
        console.warn(`⚠️ Voter ${v.voter} not found in players list during scoring`);
      }
    } else {
      const bluff = r.bluffs.find((b: Bluff) => b.id === v.choiceId);
      if (bluff) fooledCount[bluff.by] = (fooledCount[bluff.by] ?? 0) + 1;
    }
  }
  for (const pid in fooledCount) {
    const p = room.players.find((p: Player) => p.id === pid);
    if (p) {
      p.score += fooledCount[pid] * 500;
    } else {
      console.warn(`⚠️ Player ${pid} not found in players list during scoring`);
    }
  }
}

@WebSocketGateway({ namespace: '/rooms', cors: { origin: '*' } })
export class RoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() nsp!: Namespace;
  private isReady = false;

  afterInit(nsp: Namespace) {
    console.log('🚀 afterInit');
    console.log('nsp.constructor:', nsp?.constructor?.name); // ParentNamespace
    this.isReady = true;

    nsp.use((socket, next) => next());
    nsp.on('connection', (s) => {
      console.log('child nsp connected:', s.nsp.name, 'socket:', s.id);
    });
  }

  private getMainServer(): Namespace | null {
    if (!this.nsp || !this.isReady) {
      console.log('❌ nsp not ready');
      return null;
    }

    return this.nsp;
  }

  handleConnection(client: Socket) {
    try {
      const code = this.codeFromNs(client);
      console.log(`🔌 Player connected to room ${code} (ID: ${client.id})`);
      console.log(`🔌 Handshake query:`, client.handshake.query);
      
      if (!rooms.has(code)) {
        console.log(`🏠 Creating new room: ${code}`);
        rooms.set(code, {
          code,
          phase: 'lobby',
          players: [],
          round: 0,
          maxRounds: 5,
          timeLeft: 0,
          usedPromptIds: new Set(),
        });
      }
      
      const room = rooms.get(code);
      console.log(`🏠 Sending room state to ${client.id}:`, room);
      client.emit('room', room);
    } catch (error) {
      console.error(`❌ Error in handleConnection:`, error);
      client.emit('error', { msg: 'CONNECTION_ERROR' });
    }
  }

  handleDisconnect(client: Socket) {
    const code = this.codeFromNs(client);
    console.log(`🔌 Player disconnected from room ${code} (ID: ${client.id})`);
    const state = rooms.get(code);
    if (!state) return;
    const p = state.players.find((p: Player) => p.id === client.id);
    if (p) p.connected = false;

    const nsp = this.getMainServer();
    if (nsp) {
      broadcast(nsp, state);
    }
  }

  @SubscribeMessage('join')
  join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { nickname: string; avatar?: string },
  ) {
    try {
      const code = this.codeFromNs(client);
      console.log(
        `👋 Player ${body.nickname} joining room ${code} (ID: ${client.id})`,
      );
      console.log(`👋 Join request body:`, body);
      
      const state = rooms.get(code);
      if (!state) {
        console.error(`❌ Room ${code} not found!`);
        return client.emit('error', { msg: 'ROOM_NOT_FOUND' });
      }
      
      const exists = state.players.find((p: Player) => p.name === body.nickname);
      if (exists) {
        console.log(`❌ Name ${body.nickname} already taken in room ${code}`);
        return client.emit('error', { msg: 'NAME_TAKEN' });
      }

      state.players.push({
        id: client.id,
        name: body.nickname,
        avatar: body.avatar,
        connected: true,
        score: 0,
      });
      console.log(
        `✅ Player ${body.nickname} joined room ${code}. Total players: ${state.players.length}`,
      );
      client.emit('joined', { ok: true });

      const nsp = this.getMainServer();
      if (nsp) {
        // Send current room state to all clients
        broadcast(nsp, state);
        
        // If game is in progress, also send additional context to the joining player
        if (state.phase !== 'lobby') {
          console.log(`🎮 Player ${body.nickname} joining mid-game in phase: ${state.phase}`);
          
          // Send prompt if we're in prompt or later phases
          if (state.current && (state.phase === 'prompt' || state.phase === 'choose' || state.phase === 'scoring')) {
            client.emit('prompt', { question: state.current.question });
          }
          
          // Send choices if we're in choose or scoring phase
          if (state.phase === 'choose' || state.phase === 'scoring') {
            const choices = toChoices(state).map((c: Choice) => ({
              id: c.id,
              text: c.text,
            }));
            client.emit('choices', { choices });
          }
          
          // Send scores if we're in scoring phase
          if (state.phase === 'scoring') {
            client.emit('scores', {
              totals: state.players.map((p: Player) => ({
                playerId: p.id,
                score: p.score,
              })),
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error in join method:`, error);
      client.emit('error', { msg: 'JOIN_ERROR' });
    }
  }

  @SubscribeMessage('startGame')
  start(@ConnectedSocket() client: Socket) {
    const code = this.codeFromNs(client);
    const room = rooms.get(code)!;
    console.log(`🎮 Game started in room ${code}`, room);
    room.round = 1;
    this.enterPrompt(room);
  }

  private enterPrompt(room: Room) {
    const nsp = this.getMainServer();
    if (!nsp) {
      console.error('WebSocket server not ready - cannot start game');
      return;
    }

    room.phase = 'prompt';
    nextPrompt(room);
    room.timeLeft = DUR.PROMPT;
    console.log(`🎮 Prompt in room ${room.code}`, room);

    nsp.emit('prompt', { question: room.current!.question });
    tick(nsp, room, () => this.enterChoose(room));
    broadcast(nsp, room);
  }

  private enterChoose(room: Room) {
    const nsp = this.getMainServer();
    if (!nsp) {
      console.error('WebSocket server not ready - cannot continue game');
      return;
    }

    room.phase = 'choose';
    room.timeLeft = DUR.CHOOSE;
    const choices = toChoices(room).map((c: Choice) => ({
      id: c.id,
      text: c.text,
    }));
    nsp.emit('choices', { choices });
    tick(nsp, room, () => this.enterScoring(room));
    broadcast(nsp, room);
  }

  private enterScoring(room: Room) {
    const nsp = this.getMainServer();
    if (!nsp) {
      console.error('WebSocket server not ready - cannot continue game');
      return;
    }

    room.phase = 'scoring';
    room.timeLeft = DUR.SCORING;
    scoreRound(room);
    // emit score deltas + totals (simple totals for MVP)
    nsp.emit('scores', {
      totals: room.players.map((p: Player) => ({
        playerId: p.id,
        score: p.score,
      })),
    });
    tick(nsp, room, () => this.advanceOrEnd(room));
    broadcast(nsp, room);
  }

  private advanceOrEnd(room: Room) {
    const nsp = this.getMainServer();
    if (!nsp) {
      console.error('WebSocket server not ready - cannot continue game');
      return;
    }

    if (room.round >= room.maxRounds) {
      room.phase = 'over';
      broadcast(nsp, room);
      nsp.emit('gameOver', {
        winners: [...room.players]
          .sort((a: Player, b: Player) => b.score - a.score)
          .slice(0, 3)
          .map((p: Player) => ({ id: p.id, name: p.name, score: p.score })),
      });
      return;
    }
    
    room.round += 1;
    
    // Add a small delay before starting the next round to prevent recursion
    setTimeout(() => {
      this.enterPrompt(room);
    }, 1000);
  }

  @SubscribeMessage('submitAnswer')
  onAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { answer: string },
  ) {
    const room = rooms.get(this.codeFromNs(client))!;
    if (room.phase !== 'prompt') return;
    const text = (body.answer ?? '').trim();
    if (!text) return client.emit('error', { msg: 'EMPTY_ANSWER' });

    // Check if this player has already submitted an answer
    if (room.current!.bluffs.some((b: Bluff) => b.by === client.id)) {
      return client.emit('submitted', { kind: 'answer' });
    }

    // Add the answer as a bluff (this is how the game works)
    room.current!.bluffs.push({ id: uid(), by: client.id, text });
    client.emit('submitted', { kind: 'answer' });
    
    console.log(`📝 Player ${client.id} submitted answer: "${text}"`);
    
    // Broadcast updated room state to all clients
    const nsp = this.getMainServer();
    if (nsp) {
      broadcast(nsp, room);
    }
  }

  @SubscribeMessage('submitBluff')
  onBluff(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ) {
    const room = rooms.get(this.codeFromNs(client))!;
    if (room.phase !== 'prompt') return;
    const text = (body.text ?? '').trim();
    if (!text) return client.emit('error', { msg: 'EMPTY_BLUFF' });

    // de-dupe identical bluffs
    if (
      room.current!.bluffs.some(
        (b: Bluff) => b.text.toLowerCase() === text.toLowerCase(),
      )
    )
      return client.emit('submitted', { kind: 'bluff' });
    room.current!.bluffs.push({ id: uid(), by: client.id, text });
    client.emit('submitted', { kind: 'bluff' });
    // host could display submitted count (broadcast as room again if you like)
  }

  @SubscribeMessage('submitVote')
  onVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { choiceId: string },
  ) {
    const room = rooms.get(this.codeFromNs(client))!;
    if (room.phase !== 'choose') return;
    const r = room.current!;
    if (r.votes.find((v: Vote) => v.voter === client.id)) return; // no double vote
    r.votes.push({ voter: client.id, choiceId: body.choiceId });
    client.emit('submitted', { kind: 'vote' });
    
    console.log(`🗳️ Player ${client.id} submitted vote: ${body.choiceId}`);
    
    // Broadcast updated room state to all clients
    const nsp = this.getMainServer();
    if (nsp) {
      broadcast(nsp, room);
    }
  }

  private codeFromNs(client: Socket) {
    // Extract room code from query parameters since we're connecting to /rooms namespace
    const roomCode = client.handshake.query.roomCode as string;
    if (!roomCode) {
      console.error('❌ No room code provided in query parameters');
      throw new Error('Room code required');
    }
    return roomCode;
  }
}
