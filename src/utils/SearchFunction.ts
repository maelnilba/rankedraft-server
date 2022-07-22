import { Player } from "../api/types/Player";

export const NearestOpponent = (
  player: Player,
  opponents: Player[]
): Player => {
  let potentialOpps: Player[] = [];

  let minDiff = Infinity;
  for (const opp of opponents) {
    let diff = Math.abs(player.elo - opp.elo);
    if (diff === minDiff && potentialOpps.length > 0) {
      minDiff = diff;
      potentialOpps.push(opp);
    } else if (diff < minDiff) {
      minDiff = diff;
      if (potentialOpps.length > 0) {
        potentialOpps = [];
      }
      potentialOpps.push(opp);
    }
  }

  if (minDiff <= player.accept_range)
    return potentialOpps[(potentialOpps.length * Math.random()) | 0];
  else {
    let calculcateOnRetry = CalculateAcceptRange(player);
    player.accept_range = calculcateOnRetry.accept_range;
    player.retry = calculcateOnRetry.retry;
    return;
  }
};

const CalculateAcceptRange = (player: Player) => {
  const { retry } = player;
  let new_accept_range;
  if (retry >= 0 && retry < 2) new_accept_range = 250;
  else if (retry >= 2 && retry < 4) new_accept_range = 500;
  else if (retry >= 4 && retry < 8) new_accept_range = 750;
  else if (retry >= 8 && retry < 10) new_accept_range = 1000;
  else if (retry >= 10 && retry < 12) new_accept_range = 1250;
  else if (retry >= 12) new_accept_range = 1500;

  return { accept_range: new_accept_range, retry: retry + 1 };
};
