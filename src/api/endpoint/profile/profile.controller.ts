import { supabase } from "../../../supabaseClient";
import { FullProfile, InfoProfile } from "./profile.type";
import { JwtPayload } from "jsonwebtoken";

interface updateProfileQuery {
  name?: string;
  avatar?: number;
}

export const getProfileVisibility = async ({
  sub: id,
}: JwtPayload): Promise<{ visible: boolean }> => {
  let response: { visible: boolean };
  try {
    const { data, error } = await supabase
      .from("ladder")
      .select("visible")
      .match({ id })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);

    return data;
  } catch (error) {
    console.log(`Error in getProfile: ${error}`);
  }

  return response;
};

export const updateProfileVisibility = async (
  payload: { visible: boolean },
  { sub: id }: JwtPayload
): Promise<boolean> => {
  try {
    const { visible } = payload;
    const { data, error } = await supabase
      .from("ladder")
      .update({ visible })
      .match({ id })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);
    if (data) {
      return data.visible;
    }
  } catch (error) {
    console.log(error);
  }

  return false;
};

export const updateProfile = async (
  result: InfoProfile,
  { sub: id }: JwtPayload
) => {
  try {
    const { name, avatar } = result;
    const query: updateProfileQuery = {};
    if (name !== null)
      if (name.length > 2 && name.length < 25) query["name"] = name;
    if (avatar !== null) query["avatar"] = avatar;
    await supabase
      .from("profile")
      .update(query, { returning: "minimal" })
      .match({ id: id });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async ({
  sub: id,
}: JwtPayload): Promise<FullProfile> => {
  let response: FullProfile;
  try {
    const { data, error } = await supabase
      .from("ladder")
      .select(
        "profile!inner(id, name, avatar, avatars), elo, consecutives, visible"
      )
      .eq("profile.id", id)
      .limit(1)
      .single();
    if (error) throw new Error(error.message);

    response = {
      elo: data.elo,
      consecutives: data.consecutives,
      visible: data.visible,
      ...data.profile,
    };
  } catch (error) {
    console.log(`Error in getProfile: ${error}`);
  }

  return response;
};

export const getProfileFromId = async (
  id: string
): Promise<{
  id: string;
  name: string;
  avatar: number;
}> => {
  let response: {
    id: string;
    name: string;
    avatar: number;
  };
  try {
    const { data, error } = await supabase
      .from("profile")
      .select("id, name, avatar")
      .eq("id", id)
      .limit(1)
      .single();
    if (error) throw new Error(error.message);

    response = data;
  } catch (error) {
    console.log(`Error in getProfileFromId: ${error}`);
  }

  return response;
};
