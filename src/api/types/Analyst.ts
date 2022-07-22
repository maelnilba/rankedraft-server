export interface DraftLight {
  picks: {
    A: { breed: number; mode: string }[];
    B: { breed: number; mode: string }[];
  };
  bans: {
    A: number[];
    B: number[];
  };
}
interface AuthLight {
  name: string;
  logo: string;
}

interface Payload {
  url: string;
  letter: "A" | "B";
  map_id: number;
  draft: DraftLight;
  names: AuthLight[];
  is_kta: boolean;
  initiative: 0 | 1 | -1;
  result: "W" | "L" | "";
  meta: string;
  comments: string;
  date: number;
}

interface Options {
  pseudo: string;
  map_id: string;
  result: string;
  letter: string;
  is_kta: string;
  start_date: string;
  end_date: string;
  compo: number[][];
  respect_order: string;
}

interface History extends Payload {
  id: string;
}

interface HistoryResponse {
  histories: History[];
}

export { Payload, History, HistoryResponse, Options };
