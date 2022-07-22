import { supabase } from "../../../supabaseClient";
import { LadderResponse, Payload } from "./ladder.type";

export const getRank = async (id: string): Promise<any> => {
  let response: any;
  try {
    const { data, error } = await supabase
      .rpc("select_rank", { user_id: id })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);
    response = data;
  } catch (error) {
    console.log(`Error in get rank: ${error}`);
  }
  return response;
};

export const getLadder = async ({ page }): Promise<LadderResponse> => {
  let response: LadderResponse;
  try {
    const scale = 10;
    const { data, error } = await supabase
      .from("ladder")
      .select("id, profile!inner(id, name, avatar), elo, consecutives, visible")
      .range(page * scale, (page + 1) * scale - 1)
      .not("elo", "eq", 1000)
      .order("elo", {
        ascending: false,
      })
      .order("consecutives", {
        ascending: false,
      })
      .order("updated_at", {
        ascending: false,
      });

    const nextId = data?.length === scale ? page + 1 : null;
    const previousId = page > 0 ? page + 1 : null;

    if (error) throw new Error(error.message);
    response = { lines: data, nextId, previousId };
  } catch (error) {
    response = {
      lines: [],
      nextId: 0,
      previousId: 0,
    };
    console.log(`Error in getLadder: ${error}`);
  }
  return response;
};

export const getRankedFromId = async (
  id: string
): Promise<{
  id: string;
  name: string;
  elo: number;
  consecutives: number;
  visible: boolean;
  avatar: number;
}> => {
  let response: {
    id: string;
    name: string;
    elo: number;
    consecutives: number;
    visible: boolean;
    avatar: number;
  };
  try {
    const { data, error } = await supabase
      .from("ladder")
      .select("id, profile!inner(id, name, avatar), elo, consecutives, visible")
      .eq("profile.id", id)
      .limit(1)
      .single();

    if (error) return response;
    response = {
      id: data.id,
      name: data.profile.name,
      elo: data.elo,
      consecutives: data.consecutives,
      visible: data.visible,
      avatar: data.profile.avatar,
    };
  } catch (error) {
    console.log(`Error in getDataRankedFromId: ${error}`);
  }

  return response;
};

export const updateLadder = async (result: Payload) => {
  const { winner, looser } = result;
  await supabase
    .from("ladder")
    .update(
      {
        updated_at: new Date(),
        elo: winner.new_elo,
        consecutives: winner.consecutives,
      },
      { returning: "minimal" }
    )
    .match({ id: winner.id });

  await supabase
    .from("ladder")
    .update(
      {
        updated_at: new Date(),
        elo: looser.new_elo,
        consecutives: looser.consecutives,
      },
      { returning: "minimal" }
    )
    .match({ id: looser.id });
};
