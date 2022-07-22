import { Lobby } from "../api/types/Lobby";
import { Player } from "../api/types/Player";
import { LOBBY_MAX_TIME_ACCEPTED, LOBBY_MIN_TIME_ACCEPTED } from "./Constants";

export const DeterminateWinner = (lobby: Lobby): Player[] => {
  if (!(lobby.step === "Over" || lobby.step === "toOver")) return [];

  if (
    Math.floor(
      Math.abs(new Date().valueOf() - new Date(lobby.created_at).valueOf()) /
        1000 /
        60
    ) > LOBBY_MAX_TIME_ACCEPTED
  )
    return [];
  if (
    Math.floor(
      Math.abs(new Date().valueOf() - new Date(lobby.created_at).valueOf()) /
        1000
    ) < LOBBY_MIN_TIME_ACCEPTED
  )
    return [];

  if (lobby.players.length === 0 || lobby.players.length < 2) return [];

  const results = lobby.results;
  if (results.length === 0 || results.length > 2) return [];

  const winner = results.find((r) => r.his_result === 1)?.player;
  const looser = results.find((r) => r.his_result === 2)?.player;

  if (!winner || !looser) return [];

  return [winner, looser];
};
