import { supabase } from "../../../supabaseClient";
import { matchmaking } from "../../../app";

export const getSpectator = async () => {
  let response: any;
  try {
    const data = await matchmaking.spectators();
    if (!data) throw new Error("Error in get spectaors");
    response = data;
  } catch (error) {
    console.log(error);
  }
  return response;
};

export const getQueue = async ({ type }: { type: string }) => {
  let response: any;
  try {
    if (type === "count") {
      const data = await matchmaking.queueCount();
      response = { count: data ?? 0 };
    }
  } catch (error) {
    console.log(error);
  }
  return response;
};
