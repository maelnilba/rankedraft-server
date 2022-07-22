import { supabase } from "../../../supabaseClient";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { JwtPayload } from "jsonwebtoken";

interface Form {
  team_name: string;
  kta_link: string;
}

export const getTeamsNames = async ({ sub: id }: JwtPayload): Promise<any> => {
  let response: any;

  try {
    const { data, error } = await supabase
      .from("team")
      .select("id, team_name")
      .not("id", "eq", id)
      .contains("mates", [id]);

    if (error) return;
    response = data;
  } catch (error) {
    console.log(error);
  }

  return response;
};

export const joinTeam = async (
  { invitation },
  { sub: id }: JwtPayload
): Promise<any> => {
  let response = "";

  try {
    const { data, error } = await supabase
      .from("team")
      .select("id, mates")
      .match({ invitation })
      .limit(1)
      .single();

    if (!data) throw new Error("No one team with this invitiation");
    const table_id = data.id;
    if (data.mates.includes(id)) {
      throw new Error("User already in the team");
    }

    const { data: _data, error: _error } = await supabase
      .from("team")
      .update({ mates: [...data.mates, id] })
      .match({ id: table_id });

    const { data: __data, error: __error } = await supabase
      .from("member")
      .insert([{ team_id: table_id, member_id: id }], {
        returning: "minimal",
      });
    if (error || _error) response = error.message;
  } catch (error) {
    console.log(error);
  }

  return response;
};

export const quitTeam = async (
  { team_id },
  { sub: id }: JwtPayload
): Promise<any> => {
  let response = "";
  try {
    const { data: data, error: error } = await supabase
      .from("team")
      .select("id, mates")
      .match({ id: team_id })
      .limit(1)
      .single();

    if (!data) throw new Error("Aucune team trouvé avec l'id " + team_id);
    const table_id = data.id;
    let mates: any[] = data.mates;
    const { data: __data, error: __error } = await supabase
      .from("member")
      .delete()
      .match({ team_id, member_id: id });

    const index = mates.indexOf(id);
    if (index !== -1) {
      mates.splice(index, 1);
    }
    if (mates.length === 0) {
      const { error: ___error } = await supabase
        .from("history")
        .delete({ returning: "minimal" })
        .match({ team_id: team_id });
      if (___error) throw new Error(___error.message);

      const { error: _error } = await supabase
        .from("team")
        .delete({ returning: "minimal" })
        .match({ id: table_id });
      if (_error) throw new Error(_error.message);
    } else {
      const { error: _error } = await supabase
        .from("team")
        .update({ mates: [...mates] }, { returning: "minimal" })
        .match({ id: table_id });
      if (_error) throw new Error(error.message);
    }

    if (error || __error) response = error.message;
  } catch (error) {
    console.log(error);
  }
  return response;
};

export const getTeams = async ({ sub: id }: JwtPayload): Promise<any> => {
  let response: any;
  try {
    const { data: rows, error } = await supabase
      .from("member")
      .select(
        "team!inner(id, created_at, slug, invitation, kta_link, team_name, mates),profile!inner(id, name, avatar)"
      )
      .not("team.id", "eq", id)
      .contains("team.mates", [id]);

    let teams: { [key: string]: any } = {};
    if (!error && rows.length > 0) {
      for (const row of rows) {
        const { team, profile } = row;
        if (!team || !profile) return;
        const {
          id: team_id,
          created_at,
          slug,
          invitation,
          kta_link,
          team_name,
        } = team;
        if (!team_id) return;
        if (teams.hasOwnProperty(team.id)) {
          teams[team_id] = {
            ...teams[team_id],
            mates: [...teams[team_id].mates, profile],
          };
        } else {
          teams[team_id] = {
            team_id,
            created_at,
            slug,
            invitation,
            kta_link,
            team_name,
            mates: [profile],
          };
        }
      }
    }
    let data = Object.values(teams);
    data.sort(function (a, b) {
      return (
        new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf()
      );
    });
    response = data;
  } catch (error) {
    console.log(error);
  }

  return response;
};

export const postTeam = async (
  form: Form,
  { sub: id }: JwtPayload
): Promise<string> => {
  let response = "";
  const t_id = uuidv4();
  try {
    const { team_name, kta_link } = form;
    const slug = `${team_name.trim()}-${nanoid(10)}`;
    const invitation = nanoid();
    if (!team_name) throw new Error("No team name in postTeam");
    const { data, error } = await supabase
      .from("team")
      .insert([
        { id: t_id, team_name, slug, invitation, kta_link, mates: [id] },
      ]);

    const table_id = data[0].id;

    const { data: _data, error: _error } = await supabase
      .from("member")
      .insert([{ team_id: table_id, member_id: id }], {
        returning: "minimal",
      });

    if (error || _error) response = error.message;
  } catch (error) {
    console.log(`Error in postTeam: ${error}`);
  }

  return response;
};
