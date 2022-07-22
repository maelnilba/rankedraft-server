import { Socket } from "socket.io";

interface Player extends PlayerMatchmaking {
  id: string;
  socket: Socket;
  elo: number;
  join_at: Date;
  isDisconnected: boolean;
  name?: string;
  avatar?: number;
  visible?: boolean;
  consecutives: number;
}

interface PlayerMatchmaking {
  accept_range: number;
  retry: number;
}

export { Player };
