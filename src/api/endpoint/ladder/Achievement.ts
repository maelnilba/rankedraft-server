import { supabase } from "../../../supabaseClient";

export const handleAchievement = async (player: {
  id: string;
  previous_elo: number;
  new_elo: number;
  consecutives: number;
}) => {
  const { id, previous_elo, new_elo, consecutives } = player;
  try {
    const unlocks = Unlock(previous_elo, new_elo, consecutives);
    if (unlocks.unlockElo !== -1 || unlocks.unlockStrike[0] !== -1) {
      const { data, error } = await supabase
        .from("profile")
        .select("avatars")
        .match({ id })
        .limit(1)
        .single();

      if (error) throw new Error(error.message);

      const avatars = data;
      const eloObtained = unlocks.unlockElo;
      const strikeObtained = unlocks.unlockStrike;

      let obtains = [];
      if (eloObtained !== -1 && !avatars.includes(eloObtained))
        obtains = [eloObtained];
      if (strikeObtained[0] === -1 && !avatars.includes(strikeObtained[0]))
        obtains = [...obtains, ...strikeObtained];
      if (obtains.length > 0) {
        const { error: _error } = await supabase
          .from("profile")
          .update(
            { avatars: [...avatars, ...obtains] },
            { returning: "minimal" }
          )
          .match({ id });
        if (_error) throw new Error(_error.message);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const Unlock = (
  previous_elo: number,
  new_elo: number,
  consecutives: number
): {
  unlockElo: number;
  unlockStrike: [number, number];
} => {
  const unlockElo = ObtainEloAvatar(previous_elo, new_elo);
  const unlockStrike = ObtainStrikeAvatar(consecutives);
  return {
    unlockElo,
    unlockStrike,
  };
};

const AllAvatars = [
  24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 20, 21, 22,
];
const ObtainEloAvatar = (previous_elo: number, new_elo: number): number => {
  if (previous_elo < 1200 && new_elo >= 1200) return 24;
  if (previous_elo < 1600 && new_elo >= 1600) return 25;
  if (previous_elo < 2000 && new_elo >= 2000) return 26;
  if (previous_elo < 2500 && new_elo >= 2500) return 27;

  return -1;
};

const ObtainStrikeAvatar = (consecutives: number): [number, number] => {
  if (consecutives === 3) return [28, 33];
  if (consecutives === 5) return [29, 34];
  if (consecutives === 10) return [30, 35];
  if (consecutives === 15) return [31, 36];
  if (consecutives === 30) return [32, 37];

  return [-1, -1];
};
