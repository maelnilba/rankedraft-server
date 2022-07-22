import { LightProfile } from "../profile/profile.type";

interface Payload {
  winner: {
    id: string;
    previous_elo: number;
    new_elo: number;
    consecutives: number;
  };
  looser: {
    id: string;
    previous_elo: number;
    new_elo: number;
    consecutives: number;
  };
}

interface LadderResponse {
  lines: LightProfile[];
  nextId: number;
  previousId: number;
}

export { Payload, LadderResponse };
