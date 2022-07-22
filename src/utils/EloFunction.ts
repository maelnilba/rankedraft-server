import Elo from "arpad";
import { ELO_MAX_SCORE, ELO_MIN_SCORE, ELO_USCF } from "./Constants";

const elo = new Elo(ELO_USCF, ELO_MIN_SCORE, ELO_MAX_SCORE);

export const CalculateElo = (elo1: number, elo2: number): number[] => {
  let odds = elo.expectedScore(elo1, elo2);
  const nelo1 = elo.newRating(odds, 1.0, elo1);
  odds = elo.expectedScore(elo2, elo1);
  const nelo2 = elo.newRating(odds, 0, elo2);

  return [nelo1, nelo2];
};
