import { supabase } from "../../../supabaseClient";
import { JwtPayload } from "jsonwebtoken";
import { Options } from "../history/history.type";
import { Stats } from "./stats.type";

export const getStats = async (
  { sub: id }: JwtPayload,
  options: Options
): Promise<Stats> => {
  let response: Stats;
  try {
    const {
      pseudo,
      team_id,
      map_id,
      result,
      letter,
      is_kta,
      initiative,
      start_date,
      end_date,
      tags,
      compo,
      respect_order,
      respect_compo,
    } = options;

    const match = {};
    if (map_id) match["map_id"] = map_id;
    if (result) match["result"] = result;
    if (letter) match["letter"] = letter;
    if (is_kta) match["is_kta"] = is_kta;
    if (initiative) match["initiative"] = initiative;

    const select = `id, result, date, opp_name, letter, draft, map_id, initiative, team_id, team!inner(id, team_name)`;

    let query = supabase.from("history").select(select);

    if (team_id) {
      match["team_id"] = team_id;
    } else {
      query.contains("team.mates", [id]);
    }
    query.match(match);

    if (pseudo) {
      let or = "";
      for (const p of pseudo.trim().split(",")) {
        if (!p.trim()) continue;
        or += `opp_name.ilike.${p.trim()},`;
      }
      if (or) {
        or = or.slice(0, -1);
        query.or(or);
      }
    } else {
      query.ilike("opp_name", pseudo ? pseudo : "*");
    }

    if (tags) {
      let t = tags.split(",");
      t = t.map((v, i) => v.trim().toLowerCase());
      query.contains("tags", t);
    }

    if (compo) {
      const compoA = [...compo[0].filter((v, i) => v !== 0)];
      const compoB = [...compo[1].filter((v, i) => v !== 0)];

      if (respect_compo) {
        query.or(
          `and(compoA.cs.{${compoA}},compoB.cs.{${compoB}}, letter.eq.A),and(compoA.cs.{${compoB}},compoB.cs.{${compoA}}, letter.eq.B)`
        );
      } else {
        query.or(
          `and(compoA.cs.{${compoA}},compoB.cs.{${compoB}}),and(compoA.cs.{${compoB}},compoB.cs.{${compoA}})`
        );
      }
    }

    if (start_date) {
      query.gte("date", start_date);
    }

    if (end_date) {
      query.lte("date", end_date);
    }

    const { data, error } = await query;
    let stats = data;
    if (respect_order && compo) {
      const compoA = [...compo[0].filter((v, i) => v !== 0)];
      const compoB = [...compo[1].filter((v, i) => v !== 0)];
      stats = stats.filter(({ compoA: hcompoA, compoB: hcompoB }, _) => {
        for (let i = 0; i < compoA.length; i++) {
          if (compoA[i] !== hcompoA[i]) {
            return false;
          }
        }
        for (let i = 0; i < compoB.length; i++) {
          if (compoB[i] !== hcompoB[i]) {
            return false;
          }
        }
        return true;
      });
    }

    if (error) throw new Error(error.message);

    response = data;
  } catch (error) {
    console.log(`Error in getHistories: ${error}`);
  }

  return response;
};
