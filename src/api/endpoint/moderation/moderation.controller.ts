import { supabase } from "../../../supabaseClient";
import { Role } from "../../types/Role";

export const getProfiles = async (names_string): Promise<any> => {
  let response = [];
  try {
    let query = supabase
      .from("profile")
      .select("id, name, ladder(elo), avatar, avatars");
    let or = "";
    for (const name of names_string.trim().split(",")) {
      if (!name.trim()) continue;
      or += `name.ilike.${name.trim()},`;
    }
    if (or) {
      or = or.slice(0, -1);
      query.or(or);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    for (const user of data) {
      let { data } = await supabase.auth.api.getUserById(user.id);
      response = [
        ...response,
        {
          ...user,
          data,
        },
      ];
    }
  } catch (error) {
    console.log(error);
  }

  return response;
};

export const editProfile = async (payload): Promise<any> => {
  try {
    const { avatar, elo, user_id, role, ban } = payload;
    if (avatar) {
      await editProfileAvatars({ avatar, user_id });
    }
    if (elo) {
      await editProfileElo({ elo, user_id });
    }
    if (role) {
      await editProfileRole({ role, user_id });
    }
    if (ban) {
      banUser({ minutes: 60, user_id });
    }
  } catch (error) {
    console.log(error);
  }
  return;
};

const editProfileAvatars = async (payload: {
  avatar: number;
  user_id: string;
}): Promise<any> => {
  try {
    const { avatar, user_id } = payload;
    const { data, error: _error } = await supabase
      .from("profile")
      .select("avatars")
      .match({ id: user_id })
      .limit(1)
      .single();

    if (_error) throw new Error(_error.message);
    const avatars = data.includes(avatar) ? [...data] : [...data, avatar];
    const { error } = await supabase
      .from("profile")
      .update({ avatars }, { returning: "minimal" })
      .match({ id: user_id });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
  return;
};

const editProfileElo = async (payload: {
  elo: number;
  user_id: string;
}): Promise<any> => {
  try {
    const { elo, user_id } = payload;
    const { error } = await supabase
      .from("ladder")
      .update({ elo }, { returning: "minimal" })
      .match({ id: user_id });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
  return;
};

const editProfileRole = async (payload: {
  role: Role;
  user_id: string;
}): Promise<any> => {
  try {
    const { role, user_id } = payload;
    if (!(role === "orga" || role === "moderator")) return;
    const { data, user, error } = await supabase.auth.api.updateUserById(
      user_id,
      {
        app_metadata: { role: role },
      }
    );
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log(error);
  }
};

const banUser = async (payload: { minutes: number; user_id: string }) => {
  try {
    const { minutes, user_id } = payload;

    const { data, error } = await supabase.auth.api.updateUserById(user_id, {
      ban_duration: minutes === -1 ? "none" : `${minutes / 60}h`,
    } as any);
    if (error) throw new Error(error.message);
    console.log(data);
  } catch (error) {
    console.log(error);
  }
};
