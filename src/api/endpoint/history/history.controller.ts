import { supabase } from "../../../supabaseClient";
import { JwtPayload } from "jsonwebtoken";
import {
  HistoryResponse,
  Options,
  Payload as History,
  Payload,
} from "./history.type";

export const getHistory = async (uuid: string): Promise<History> => {
  let response: History;
  try {
    const { data, error } = await supabase
      .from("history")
      .select(
        "url, result, map_id, comments, draft, names, initiative, letter, is_kta, team(id, team_name), tags"
      )
      .match({ id: uuid });
    if (error) throw new Error(error.message);
    response = data[0];
  } catch (error) {
    console.log(`Error in getHistory: ${error}`);
  }

  return response;
};

export const getHistories = async (
  { sub: id }: JwtPayload,
  options: Options
): Promise<HistoryResponse> => {
  let response: HistoryResponse;
  try {
    const scale = 10;
    const {
      page,
      pseudo,
      map_id,
      result,
      letter,
      is_kta,
      initiative,
      start_date,
      end_date,
      compo,
      respect_order,
      team_id,
      respect_compo,
      tags,
    } = options;

    const select =
      "id, result, team!inner(*), date, comments, opp_name, opp_logo, letter, is_kta, compoA, compoB";

    const match = {};
    if (map_id) match["map_id"] = map_id;
    if (result) match["result"] = result;
    if (letter) match["letter"] = letter;
    if (is_kta) match["is_kta"] = is_kta;
    if (initiative) match["initiative"] = initiative;

    let query = supabase.from("history").select(select);

    if (team_id) {
      match["team_id"] = team_id;
    } else {
      query.contains("team.mates", [id]);
    }
    query.match(match);
    if (tags) {
      let t = tags.split(",");
      t = t.map((v, i) => v.trim().toLowerCase());
      query.contains("tags", t);
    }
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

    query.range(page * scale, (page + 1) * scale - 1).order("date", {
      ascending: false,
    });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let histories = data;

    if (respect_order && compo) {
      const compoA = [...compo[0].filter((v, i) => v !== 0)];
      const compoB = [...compo[1].filter((v, i) => v !== 0)];
      histories = histories.filter(
        ({ compoA: hcompoA, compoB: hcompoB }, _) => {
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
        }
      );
    }

    const nextId = data?.length === scale ? page + 1 : null;
    const previousId = page > 0 ? page + 1 : null;
    response = {
      histories,
      nextId,
      previousId,
    };
  } catch (error) {
    response = {
      histories: [],
      nextId: 0,
      previousId: 0,
    };
    console.log(`Error in getHistories: ${error}`);
  }

  return response;
};

export const insertHistory = async (
  payload: Payload,
  { sub: id }: JwtPayload
) => {
  try {
    const { letter, draft, names, team_id, tags } = payload;
    const isA = letter === "A";

    let t = [];
    if (tags) {
      let count = (tags.match(/,/g) || []).length;
      if (count < 11) t = tags.split(",").map((v, i) => v.trim().toLowerCase());
    }

    const { error } = await supabase.from("history").insert(
      {
        ...payload,
        user_id: id,
        opp_name: isA ? names[1]?.name : names[0]?.name ?? "",
        opp_logo: isA ? names[1]?.logo : names[0]?.logo ?? "",
        tags: t,
        compoA: [
          draft.picks.A[0].breed,
          draft.picks.A[1].breed,
          draft.picks.A[2].breed,
        ],
        compoB: [
          draft.picks.B[0].breed,
          draft.picks.B[1].breed,
          draft.picks.B[2].breed,
        ],
        team_id: team_id ?? id,
      },
      { returning: "minimal" }
    );
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
};

export const editHistory = async (
  { sub: id }: JwtPayload,
  uuid: string,
  payload
): Promise<HistoryResponse> => {
  let response: HistoryResponse;
  try {
    const { letter, draft, names, tags } = payload;
    let { team_id, ...npayload } = payload;
    if (team_id) npayload = { ...payload, team_id };
    let t = [];
    if (tags) {
      let count = (tags.match(/,/g) || []).length;
      if (count < 11) t = tags.split(",").map((v, i) => v.trim().toLowerCase());
    }
    const isA = letter === "A";
    const { data, error } = await supabase
      .from("history")
      .update({
        ...npayload,
        user_id: id,
        tags: t,
        opp_name: isA ? names[1]?.name : names[0]?.name ?? "",
        opp_logo: isA ? names[1]?.logo : names[0]?.logo ?? "",
        compoA: [
          draft.picks.A[0].breed,
          draft.picks.A[1].breed,
          draft.picks.A[2].breed,
        ],
        compoB: [
          draft.picks.B[0].breed,
          draft.picks.B[1].breed,
          draft.picks.B[2].breed,
        ],
      })
      .match({ id: uuid });
    if (error) throw new Error(error.message);
    response = data[0];
  } catch (error) {
    console.log(error);
  }

  return response;
};

export const deleteHistory = async ({ sub: id }: JwtPayload, uuid: string) => {
  try {
    const { error } = await supabase
      .from("history")
      .delete({ returning: "minimal" })
      .match({ id: uuid });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
};

export const deleteHistories = async ({ sub: id }: JwtPayload) => {
  try {
    const { error } = await supabase
      .from("history")
      .delete({ returning: "minimal" })
      .match({ user_id: id, team_id: id });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
};
