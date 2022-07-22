interface Profile {
  id: string;
  name: string;
  elo: number;
  consecutives: number;
  avatar: number;
}

interface LightProfile {
  id: string;
  profile: {
    id: string;
    name: string;
    avatar: number;
  };
  elo: number;
  consecutives: number;
  visible: boolean;
}

interface FullProfile extends Profile {
  avatars: number[];
  visibile: boolean;
}

interface InfoProfile {
  name: string;
  avatar: number;
}

export { Profile, LightProfile, FullProfile, InfoProfile };
