import { Request } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { supabase } from "../../supabaseClient";
import { Role } from "../types/Role";

export const isAuth = async (request: Request): Promise<JwtPayload | null> => {
  let authHeader = request.headers.authorization;
  let result: JwtPayload;
  const token = authHeader.split(" ")[1];
  try {
    const decode = verify(token, process.env.JWT_SECRET);
    result = decode as JwtPayload;
  } catch (error) {
    console.log(
      `Jwt Malformed from ${
        request.headers["x-forwarded-for"] || request.connection.remoteAddress
      } wanted ${request.originalUrl}`
    );
  }
  return result;
};

const RolesList: Role[] = ["admin", "moderator", "orga", "authenticated"];

export const isRole = async ({ sub: id }: JwtPayload, role: Role) => {
  try {
    const { data, error } = await supabase.auth.api.getUserById(id);
    if (error) throw new Error(error.message);
    const user_role = data.app_metadata?.role;
    if (!user_role) return false;
    if (RolesList.includes(user_role)) {
      let idx = RolesList.findIndex((r) => r === user_role);
      if (idx <= RolesList.findIndex((r) => r === role)) {
        return true;
      }
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return false;
};
