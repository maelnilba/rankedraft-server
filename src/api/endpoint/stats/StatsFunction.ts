import { Stats, Stat } from "./stats.type";

const YisWhatPercentOfX = (y: number, x: number) => {
  if (x === 0) return 100;
  return (y / x) * 100;
};

export const makeArrayOfRange = <T>(limit: number[]): T[] => {
  return Array.apply(null, Array(Math.abs(limit[1] - limit[0] + 1))).map(
    (_: any, i: number) => {
      return null;
    }
  );
};

const StatsGlobale = (stats: Stats) => {
  let wins = 0;
  let looses = 0;
  for (const stat of stats) {
    const { result } = stat;
    if (result === "W") wins = wins + 1;
    if (result === "L") looses = looses + 1;
  }

  return {
    wins,
    wins_percent: YisWhatPercentOfX(wins, wins + looses),
    looses,
    looses_percent: YisWhatPercentOfX(looses, wins + looses),
  };
};

const StatsLettre = (stats: Stats) => {
  let wins = { A: 0, B: 0 };
  let looses = { A: 0, B: 0 };
  let letters = { A: 0, B: 0 };
  for (const stat of stats) {
    const { result, letter } = stat;
    if (!letter) return;
    letters[letter] = letters[letter] + 1;
    if (result === "W") wins[letter] = wins[letter] + 1;
    if (result === "L") looses[letter] = looses[letter] + 1;
  }

  return {
    A: {
      number: letters.A,
      wins: wins.A,
      wins_percent: YisWhatPercentOfX(wins.A, wins.A + looses.A),
    },
    B: {
      number: letters.B,
      wins: wins.B,
      wins_percent: YisWhatPercentOfX(wins.B, wins.B + looses.B),
    },
  };
};

const StatsIni = (stats: Stats) => {
  let wins = { C: 0, N: 0 };
  let looses = { C: 0, N: 0 };
  let inis = { C: 0, N: 0 };
  for (const stat of stats) {
    const { result, initiative } = stat;
    if (!initiative) return;
    const ini = initiative === 1 ? "NC" : initiative === 1 ? "C" : "N";
    if (ini === "NC") return;
    inis[ini] = inis[ini] + 1;
    if (result === "W") wins[ini] = wins[ini] + 1;
    if (result === "L") looses[ini] = looses[ini] + 1;
  }

  const total = wins.C + wins.N + looses.C + looses.N;

  return {
    C: {
      number: inis.C,
      wins: wins.C,
      wins_percent: YisWhatPercentOfX(wins.C, total),
    },
    N: {
      Number: inis.N,
      wins: wins.N,
      wins_percent: YisWhatPercentOfX(wins.N, total),
    },
  };
};

interface Repartition {
  wins: number;
  looses: number;
  percent: number;
}

const StatsMyPicks = (stats: Stats) => {
  const classes = makeArrayOfRange<Repartition>([1, 18]);
  for (let i = 0; i < classes.length; i++) {
    classes[i] = { wins: 0, looses: 0, percent: 0 };
  }

  for (const stat of stats) {
    const { result, draft, letter } = stat;
    const { picks } = draft;
    const my_picks: { breed: number; mode: string }[] = picks[letter];

    for (const { breed } of my_picks) {
      if (result === "W") {
        classes[breed - 1].wins = classes[breed - 1].wins + 1;
      }
      if (result === "L") {
        classes[breed - 1].looses = classes[breed - 1].looses + 1;
      }
    }
  }

  for (let i = 0; i < classes.length; i++) {
    classes[i].percent = YisWhatPercentOfX(
      classes[i].wins,
      classes[i].wins + classes[i].looses
    );
  }

  return { repartitions: classes };
};

const StatsTheirPicks = (stats: Stats) => {
  const classes = makeArrayOfRange<Repartition>([1, 18]);
  for (let i = 0; i < classes.length; i++) {
    classes[i] = { wins: 0, looses: 0, percent: 0 };
  }

  for (const stat of stats) {
    const { result, draft, letter } = stat;
    const { picks } = draft;
    const their_pick: { breed: number; mode: string }[] =
      picks[letter === "A" ? "B" : "A"];

    for (const { breed } of their_pick) {
      if (result === "W") {
        classes[breed - 1].wins = classes[breed - 1].wins + 1;
      }
      if (result === "L") {
        classes[breed - 1].looses = classes[breed - 1].looses + 1;
      }
    }
  }

  for (let i = 0; i < classes.length; i++) {
    classes[i].percent = YisWhatPercentOfX(
      classes[i].wins,
      classes[i].wins + classes[i].looses
    );
  }

  return { repartitions: classes };
};

const StatsMaps = (stats: Stats) => {
  const maps = makeArrayOfRange<Repartition>([1, 30]);
  for (let i = 0; i < maps.length; i++) {
    maps[i] = { wins: 0, looses: 0, percent: 0 };
  }

  for (const stat of stats) {
    const { result, map_id } = stat;
    if (map_id < 1 || map_id > 30) return;
    if (result === "W") {
      maps[map_id].wins = maps[map_id].wins + 1;
    }
    if (result === "L") {
      maps[map_id].looses = maps[map_id].looses + 1;
    }
  }

  for (let i = 0; i < maps.length; i++) {
    maps[i].percent = YisWhatPercentOfX(
      maps[i].wins,
      maps[i].wins + maps[i].looses
    );
  }

  return { repartitions: maps };
};

const StatsOpponent = (stats: Stats) => {
  let repartitions: { [k: string]: any } = {};

  for (const stat of stats) {
    const { result, opp_name } = stat;

    if (repartitions.hasOwnProperty(opp_name)) {
      if (result === "W") {
        repartitions[opp_name].wins = repartitions[opp_name].wins + 1;
      }
      if (result === "L") {
        repartitions[opp_name].looses = repartitions[opp_name].looses + 1;
      }
    } else {
      repartitions[opp_name] = {
        wins: result === "W" ? 1 : 0,
        looses: result === "L" ? 1 : 0,
        percent: 0,
      };
    }
  }

  for (const opponent in repartitions) {
    repartitions[opponent].percent = YisWhatPercentOfX(
      repartitions[opponent].wins,
      repartitions[opponent].wins + repartitions[opponent].looses
    );
  }

  return { repartitions };
};

export const AllStats = (stats: Stats) => {
  try {
    const Globale = StatsGlobale(stats);
    const Lettre = StatsLettre(stats);

    const Initiative = StatsIni(stats);

    const MyPicks = StatsMyPicks(stats);

    const TheirPicks = StatsTheirPicks(stats);

    const Maps = StatsMaps(stats);

    const Opponents = StatsOpponent(stats);

    return {
      Globale,
      Lettre,
      Initiative,
      MyPicks,
      TheirPicks,
      Maps,
      Opponents,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};
