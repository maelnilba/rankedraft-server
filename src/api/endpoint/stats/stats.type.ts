import { Auth } from "../../types/Draft";
import { DraftLight } from "../history/history.type";

export interface Stat {
  id: string;
  result: string;
  date: number;
  opp_name: string;
  letter: string;
  draft: DraftLight;
  names: Auth[];
  map_id: number;
  initiative: number;
}

export type Stats = Stat[];

export interface Repartition {
  wins: number;
  looses: number;
  percent: number;
}
export interface RepartitionsArray {
  repartitions: Repartition[];
}
export interface RepartitionsObj {
  [key: string]: Repartition;
}
