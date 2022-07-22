import { Player } from "./Player";

interface Result {
  player: Player;
  his_result: 1 | 2; // 1 = Victoire, 2 = Défaite
  send_at: Date;
}
interface Lobby {
  players: Player[];
  confirmation: { confirms: string[]; countdown: NodeJS.Timeout[] };
  results: Result[];
  created_at: Date;
  draft_url: string;
  senderId: string;
  step: "toConfirm" | "toValidate" | "toOver" | "Over";
  last_update: Date;
}

export { Lobby, Result };
