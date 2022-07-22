export const SERVER_PORT = process.env.PORT || 4000;
export const ORIGIN =
  process.env.NODE_ENV === "production" ? "*" : "http://localhost:3000";
export const MATCHMAKING_QUEUE_SHUFFLE_TIMER = 30000;
export const MATCHMAKING_QUEUE_FORFEIT_TIME = 45000;
export const MATCHMAKING_CONFIRMATION_FORFEIT_TIME = 60000;
export const PROTOCOL = {
  TO_CONFIRM: "toConfirm",
  TO_VALIDATE: "toValidate",
  TO_OVER: "toOver",
  OPPONENT_LEFT: "OpponentLeft",
  ASK_CONFIRM: "askConfirm",
  ASK_URL: "askURL",
  ASK_UUID: "askUuid",
  SEND_URL: "sendURL",
  ASK_OVER: "askOver",
  RECONNECTION: "reconnection",
  RESPONSE_CONFIRM: "ReponseConfirm",
  RESPONSE_VALIDATE: "ResponseValidate",
  RESPONSE_URL: "ResponseURL",
  RESPONSE_OVER: "ResponseOver",
  CONFIRM_OVER: "ConfirmOver",
  SEND_OVER: "Over",
  FORCED_DISCONNECTION: "ForcedDisconnection",
  RESPONSE_RECONNECTION: "Reconnection",
  REGISTER: "Register",
  SEND_CONNECTION: "sendConnection",
  SEND_ALREADYIN: "AlreadyIn",
  UNREGISTER: "Unregister",
  FORFEIT: "Forfeit",
  QUIT_QUEUE: "QuitQueue",
  FORCEQUIT: "ForceQuit",
};
export const ELO_USCF = {
  default: 32,
  2100: 24,
  2400: 16,
};
export const ELO_MIN_SCORE = 100;
export const ELO_MAX_SCORE = 10000;
export const LOBBY_MIN_TIME_ACCEPTED = 160;
export const LOBBY_MAX_TIME_ACCEPTED = 180;
