import { Socket, Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Lobby, Result } from "./api/types/Lobby";
import { Player } from "./api/types/Player";
import { getRankedFromId } from "./api/endpoint/ladder/ladder.controller";
import { Payload as updateLadderPayload } from "./api/endpoint/ladder/ladder.type";

import {
  MATCHMAKING_CONFIRMATION_FORFEIT_TIME,
  MATCHMAKING_QUEUE_FORFEIT_TIME,
  MATCHMAKING_QUEUE_SHUFFLE_TIMER,
  PROTOCOL,
} from "./utils/Constants";
import { NearestOpponent } from "./utils/SearchFunction";
import { DeterminateWinner } from "./utils/LobbyFunction";
import { CalculateElo } from "./utils/EloFunction";
import { updateLadder } from "./api/endpoint/ladder/ladder.controller";

type PlayerType = {
  id: string;
  name: string;
  elo: number;
  consecutives: number;
  visible: boolean;
  avatar: number;
};

export class Matchmaking {
  queue: Player[];
  lobbies: {
    [key: string]: Lobby | null;
  };
  lobbies_interrupted: string[];
  interval: NodeJS.Timer;
  constructor() {
    this.queue = [];
    this.lobbies = {};
    this.lobbies_interrupted = [];
    this.interval = setInterval(
      this.runtime.bind(this),
      MATCHMAKING_QUEUE_SHUFFLE_TIMER
    );
  }

  runtime() {
    this.checkLobbiesInterrupted();
    if (this.queue.length > 0) this.shuffle();
  }

  async queueCount() {
    return (this.queue || []).length;
  }

  async spectators() {
    let lobbies_visible = [];

    for (const lobbyId in this.lobbies) {
      let _players = [];
      let { players, created_at, draft_url, last_update, step } =
        this.lobbies[lobbyId];
      if (step !== "toOver") continue;
      if (!draft_url) continue;
      for (const player of players) {
        if (player.visible) {
          _players = [
            ..._players,
            {
              id: player.id,
              name: player.name,
              elo: player.elo,
              avatar: player.avatar,
            },
          ];
        }
      }

      if (_players.length > 1) {
        lobbies_visible = [
          ...lobbies_visible,
          {
            id: lobbyId,
            url: draft_url,
            created_at,
            last_update,
            players: _players,
          },
        ];
      }
    }
    return lobbies_visible;
  }

  panel() {
    let queue_panel = [];
    this.queue.map((s, i) => {
      queue_panel.push({ id: s.id, name: s.name, elo: s.elo });
    });
    let lobbies_panel = [];
    for (const lobbyId in this.lobbies) {
      let players_panel = [];
      let { players, step, created_at, draft_url, last_update } =
        this.lobbies[lobbyId];
      for (const player of players) {
        players_panel.push({
          id: player.id,
          name: player.name,
          elo: player.elo,
          isDisconnected: player.isDisconnected,
        });
      }
      lobbies_panel.push({
        players: players_panel,
        step,
        created_at,
        last_update,
        draft_url,
      });
    }
    return {
      queue: queue_panel,
      lobbies: lobbies_panel,
    };
  }

  shuffle() {
    for (const player of this.queue) {
      let opponent = NearestOpponent(
        player,
        this.queue.filter((p) => p !== player)
      );

      try {
        if (!opponent) continue;
        if (opponent.id === player.id) continue;
        if (process.env.NODE_ENV === "production")
          if (
            (player.socket as any).adressIp ===
            (opponent.socket as any).adressIp
          )
            continue;
      } catch (error) {
        console.log(error);
        continue;
      }

      this.createLobby(player, opponent);
    }
  }

  async checkLobbiesInterrupted() {
    for (const lobby of this.lobbies_interrupted) {
      if (!this.lobbies[lobby]) continue;

      const socket = this.lobbies[lobby].players.filter(
        (p) => p.isDisconnected
      )[0];

      if (!socket) continue;

      if (
        new Date().getTime() -
          new Date(this.lobbies[lobby].last_update).getTime() <
        MATCHMAKING_QUEUE_FORFEIT_TIME
      ) {
        continue;
      }

      if (this.lobbies[lobby].step === PROTOCOL.TO_OVER) {
        // If disconnect and not send result, but other's send he won
        if (
          this.lobbies[lobby].results.filter(
            (r) => r.player.id === (socket as any).customId
          ).length === 0
        ) {
          if (
            this.lobbies[lobby].results.filter((r) => r.his_result === 1)
              .length === 1
          ) {
            this.lobbies[lobby].results.push({
              player: this.lobbies[lobby].players.filter(
                (p) => p.id === (socket as any).customId
              )[0],
              his_result: 2,
              send_at: new Date(),
            });
            this.endLobby(lobby);
            this.lobbies_interrupted.splice(
              this.lobbies_interrupted.indexOf(lobby),
              1
            );
            continue;
          }
        }

        this.lobbies[lobby].players = this.lobbies[lobby].players.filter(
          (p) => p.id === (socket as any).customId
        );
        await this.lobbyMessage(PROTOCOL.OPPONENT_LEFT, lobby);
        delete this.lobbies[lobby];
        this.lobbies_interrupted.splice(
          this.lobbies_interrupted.indexOf(lobby),
          1
        );
      }
    }
  }

  async createLobby(player1: Player, player2: Player) {
    let uuid = uuidv4();
    this.queue = this.queue.filter((p) => p !== player1 && p !== player2);
    let lobby: Lobby = {
      players: [player1, player2],
      results: [],
      confirmation: { confirms: [], countdown: [] },
      draft_url: "",
      senderId: "",
      created_at: new Date(),
      step: "toConfirm",
      last_update: new Date(),
    };
    this.lobbies[uuid] = lobby;
    await this.lobbyMessage(PROTOCOL.ASK_CONFIRM, uuid);
  }

  endLobby(lobbyId: string) {
    const lobby = this.lobbies[lobbyId];
    delete this.lobbies[lobbyId];

    const results = DeterminateWinner(lobby);
    if (!results.length) return;
    const elos = CalculateElo(results[0].elo, results[1].elo);
    const players: updateLadderPayload = {
      winner: {
        id: results[0].id,
        consecutives: results[0].consecutives + 1,
        previous_elo: results[0].elo,
        new_elo: elos[0],
      },
      looser: {
        id: results[1].id,
        consecutives: 0,
        previous_elo: results[1].elo,
        new_elo: elos[1],
      },
    };

    updateLadder(players);
  }

  async lobbyMessage(message: string, lobbyId: string) {
    try {
      switch (message) {
        case PROTOCOL.ASK_CONFIRM:
          let playersProfile: PlayerType[] = [];
          for (const player of this.lobbies[lobbyId].players) {
            let profile = await getRankedFromId(player.id);
            player.name = profile.name;
            player.avatar = profile.avatar;
            player.visible = profile.visible;
            playersProfile.push(profile);
          }
          for (const player of this.lobbies[lobbyId].players) {
            player.socket.emit(message, {
              uuid: lobbyId,
              players: playersProfile,
            });

            this.lobbies[lobbyId].confirmation.countdown.push(
              setTimeout(() => {
                if (!this.lobbies[lobbyId] || !this.lobbies[lobbyId].players)
                  return;
                this.lobbies[lobbyId].players = this.lobbies[
                  lobbyId
                ].players.filter((p) => p.id !== player.id);

                if (this.lobbies[lobbyId].players.length === 0) {
                  delete this.lobbies[lobbyId];
                } else if (
                  this.lobbies[lobbyId].confirmation.confirms.length > 0
                ) {
                  this.lobbies[lobbyId].players &&
                    this.lobbies[lobbyId].players.length > 0 &&
                    this.lobbies[lobbyId].players[0].socket.emit(
                      PROTOCOL.OPPONENT_LEFT,
                      {}
                    );
                  delete this.lobbies[lobbyId];
                }
                player.socket.emit(PROTOCOL.FORCED_DISCONNECTION, {});
              }, MATCHMAKING_CONFIRMATION_FORFEIT_TIME)
            );
          }
          break;
        case PROTOCOL.ASK_URL:
          let WhoShouldSendIndex = (2 * Math.random()) | 0;
          this.lobbies[lobbyId].senderId =
            this.lobbies[lobbyId].players[WhoShouldSendIndex].id;
          this.lobbies[lobbyId].players[WhoShouldSendIndex].socket.emit(
            message,
            {
              shouldSend: true,
            }
          );
          this.lobbies[lobbyId].players[
            WhoShouldSendIndex === 1 ? 0 : 1
          ].socket.emit(message, {
            shouldSend: false,
          });
          break;
        case PROTOCOL.SEND_URL:
          for (const player of this.lobbies[lobbyId].players) {
            player.socket.emit(message, {
              draft_url: this.lobbies[lobbyId].draft_url,
            });
          }
          break;
        case PROTOCOL.ASK_OVER:
          for (const player of this.lobbies[lobbyId].players) {
            player.socket.emit(message, {});
          }
          break;
        case PROTOCOL.OPPONENT_LEFT:
          for (const player of this.lobbies[lobbyId].players) {
            player.socket.emit(message, {});
          }
          break;

        case PROTOCOL.RECONNECTION:
          const { players, confirmation, draft_url, results, step, senderId } =
            this.lobbies[lobbyId];

          for (const player of this.lobbies[lobbyId].players) {
            if (player.isDisconnected) {
              for (let i = 0; i < this.lobbies[lobbyId].players.length; i++) {
                if (this.lobbies[lobbyId].players[i].isDisconnected) {
                  this.lobbies[lobbyId].players[i].isDisconnected = false;
                }
              }
              player.socket.emit(message, {
                lobby: {
                  uuid: lobbyId,
                  confirms: confirmation.confirms,
                  players: [
                    {
                      id: players[0].id,
                      name: players[0].name ?? "Undefined",
                      elo: players[0].elo,
                      avatar: players[0].avatar,
                    },
                    {
                      id: players[1].id,
                      name: players[1].name ?? "Undefined",
                      elo: players[1].elo,
                      avatar: players[1].avatar,
                    },
                  ],
                  draft_url: draft_url,
                  results:
                    results.length > 0
                      ? [
                          {
                            id: results[0].player.id,
                            r: results[0].his_result,
                          },
                        ]
                      : [],
                  step: step,
                  senderId: senderId,
                },
              });
            }
          }
          break;
        case PROTOCOL.SEND_OVER:
          for (const player of this.lobbies[lobbyId].players) {
            player.socket.emit(message, {
              result:
                this.lobbies[lobbyId].results[0].his_result !==
                this.lobbies[lobbyId].results[0].his_result
                  ? 1
                  : 0,
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async lobbyResponse(message: string, data: any, socket: Socket) {
    try {
      let lobbyId = data.uuid;
      if (
        message !== PROTOCOL.QUIT_QUEUE &&
        message !== PROTOCOL.FORCEQUIT &&
        lobbyId === PROTOCOL.FORCEQUIT
      ) {
        if (!lobbyId && !this.lobbies[lobbyId]) {
          return;
        }

        if (lobbyId && !this.lobbies[lobbyId]) {
          return;
        }

        if (this.lobbies[lobbyId].players.length < 2) {
          return;
        }
      }

      switch (message) {
        case PROTOCOL.RESPONSE_CONFIRM:
          let OK = data.OK;
          if (!OK) {
            for (const timeout of this.lobbies[lobbyId]?.confirmation
              .countdown) {
              clearTimeout(timeout);
            }
            if (!this.lobbies[lobbyId] || !this.lobbies[lobbyId].players)
              return;
            this.lobbies[lobbyId].players = this.lobbies[
              lobbyId
            ].players.filter((p) => p.id !== (socket as any).customId);
            if (
              this.lobbies[lobbyId].players &&
              this.lobbies[lobbyId].players.length > 0
            ) {
              this.lobbies[lobbyId].players[0].socket.emit(
                PROTOCOL.OPPONENT_LEFT,
                {}
              );
            }

            delete this.lobbies[lobbyId];

            socket.emit(PROTOCOL.FORCED_DISCONNECTION, {});
            return;
          }

          this.lobbies[lobbyId]?.confirmation.confirms.push(
            (socket as any).customId
          );

          for (let i = 0; i < this.lobbies[lobbyId].players.length; i++) {
            if (
              this.lobbies[lobbyId].players[i].id === (socket as any).customId
            ) {
              clearTimeout(this.lobbies[lobbyId]?.confirmation.countdown[i]);
            }
          }

          if (this.lobbies[lobbyId]?.confirmation.confirms.length >= 2) {
            this.lobbies[lobbyId].step = "toValidate";
            await this.lobbyMessage("askURL", lobbyId);
          }
          this.lobbies[lobbyId].last_update = new Date();
          break;
        case PROTOCOL.RESPONSE_URL:
          let draft_url = data.draft_url;
          this.lobbies[lobbyId].draft_url = draft_url;
          await this.lobbyMessage("sendURL", lobbyId);
          this.lobbies[lobbyId].last_update = new Date();
          break;
        case PROTOCOL.RESPONSE_VALIDATE:
          this.lobbies[lobbyId].step = "toOver";
          await this.lobbyMessage("askOver", lobbyId);
          this.lobbies[lobbyId].last_update = new Date();
          break;
        case PROTOCOL.RESPONSE_OVER:
          let result: Result = {
            player: this.lobbies[lobbyId]?.players.filter(
              (p) => p.id === (socket as any).customId
            )[0],
            his_result: data.result,
            send_at: new Date(),
          };
          this.lobbies[lobbyId].results.push(result);
          this.lobbies[lobbyId].last_update = new Date();
          if (this.lobbies[lobbyId].results.length === 2) {
            this.lobbies[lobbyId].step = "Over";
            await this.lobbyMessage(PROTOCOL.SEND_OVER, lobbyId);
            this.endLobby(lobbyId);
          } else {
            socket.emit(PROTOCOL.CONFIRM_OVER, {
              result: this.lobbies[lobbyId].results[0].his_result,
            });
          }
          break;

        case PROTOCOL.FORFEIT:
          if (!this.lobbies[lobbyId] || !this.lobbies[lobbyId].players) return;
          this.lobbies[lobbyId].players = this.lobbies[lobbyId].players.filter(
            (p) => p.id !== (socket as any).customId
          );
          this.lobbies[lobbyId].players &&
            this.lobbies[lobbyId].players[0].socket.emit(
              PROTOCOL.OPPONENT_LEFT,
              {}
            );
          delete this.lobbies[lobbyId];
          socket.emit(PROTOCOL.FORCED_DISCONNECTION, {});

          break;

        case PROTOCOL.QUIT_QUEUE:
          if (
            this.queue.filter((p) => p.id === (socket as any).customId).length >
            0
          ) {
            this.queue = this.queue.filter(
              (p) => p.id !== (socket as any).customId
            );
            socket.emit(PROTOCOL.FORCED_DISCONNECTION);
          }
          break;

        case PROTOCOL.FORCEQUIT:
          if (lobbyId === PROTOCOL.FORCEQUIT) {
            if (this.queue.filter((p) => p.id === data.id).length > 0) {
              this.queue
                .find((p) => p.id === data.id)
                ?.socket.emit(PROTOCOL.FORCED_DISCONNECTION);
              this.queue = this.queue.filter((p) => p.id !== data.id);
              socket.emit(PROTOCOL.FORCED_DISCONNECTION);
            }
          } else {
            if (!this.lobbies[lobbyId] || !this.lobbies[lobbyId].players)
              return;
            this.lobbies[lobbyId].players
              .find((p) => p.id === data.id)
              ?.socket.emit(PROTOCOL.FORCED_DISCONNECTION);
            this.lobbies[lobbyId].players = this.lobbies[
              lobbyId
            ].players.filter((p) => p.id !== data.id);
            this.lobbies[lobbyId].players &&
              this.lobbies[lobbyId].players[0].socket.emit(
                PROTOCOL.OPPONENT_LEFT,
                {}
              );
            delete this.lobbies[lobbyId];
            socket.emit(PROTOCOL.FORCED_DISCONNECTION);
          }

          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async reconnect(socket: Socket) {
    try {
      const id: string = (socket as any).customId;

      for (const lobbyId of this.lobbies_interrupted) {
        for (let i = 0; i < this.lobbies[lobbyId].players.length; i++) {
          if (this.lobbies[lobbyId].players[i].id === id) {
            this.lobbies[lobbyId].players[i].socket = socket;
            await this.lobbyMessage(PROTOCOL.RECONNECTION, lobbyId);
            this.lobbies_interrupted.splice(
              this.lobbies_interrupted.indexOf(lobbyId),
              1
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  connect(socket: Socket) {
    for (const lobbyId of this.lobbies_interrupted) {
      for (let i = 0; i < this.lobbies[lobbyId].players.length; i++) {
        if (this.lobbies[lobbyId].players[i].isDisconnected) {
          socket.emit(PROTOCOL.ASK_UUID, {});
        }
      }
    }
  }

  async loggin(socket: Socket) {
    try {
      const id: string = (socket as any).customId;

      if (this.queue.filter((p) => p.id === id).length > 0) {
        socket.emit(PROTOCOL.SEND_ALREADYIN, { lobbyId: "" });
        (socket as any).customId = uuidv4();
        return;
      }
      for (const lobby in this.lobbies) {
        if (this.lobbies[lobby].players.filter((p) => p.id === id).length > 0) {
          socket.emit(PROTOCOL.SEND_ALREADYIN, { lobbyId: lobby });
          (socket as any).customId = uuidv4();
          return;
        }
      }

      const data = await getRankedFromId(id);
      if (!data) {
        return;
      }
      this.queue.push({
        id,
        socket,
        elo: data.elo,
        join_at: new Date(),
        isDisconnected: false,
        consecutives: data.consecutives,
        accept_range: 100,
        retry: 0,
      });

      if (this.logginVerification(socket)) {
        socket.emit(PROTOCOL.SEND_CONNECTION, {
          res: true,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  logginVerification(socket: Socket) {
    const id: string = (socket as any).customId;

    if (this.queue.filter((p) => p.id === id).length > 1) {
      let newId = uuidv4();
      (socket as any).customId = newId;
      this.queue = this.queue.filter((p) => p.id === newId);
      return false;
    }

    return true;
  }

  async disconnect(socket: Socket) {
    try {
      if (
        this.queue.filter((p) => p.id === (socket as any).customId).length > 0
      ) {
        this.queue = this.queue.filter(
          (p) => p.id !== (socket as any).customId
        );
        return;
      }

      let lobbyId = "";
      for (const lobby in this.lobbies) {
        if (
          this.lobbies[lobby].players.filter(
            (p) => p.id === (socket as any).customId
          ).length > 0
        ) {
          lobbyId = lobby;
          break;
        }
      }

      if (lobbyId) {
        this.lobbies[lobbyId].players.filter(
          (p) => p.id === (socket as any).customId
        )[0].isDisconnected = true;
        this.lobbies[lobbyId].last_update = new Date();

        if (
          this.lobbies[lobbyId].players.filter((p) => p.isDisconnected)
            .length == 2
        ) {
          this.lobbies_interrupted.splice(
            this.lobbies_interrupted.indexOf(lobbyId),
            1
          );
          delete this.lobbies[lobbyId];
        } else {
          this.lobbies_interrupted.push(lobbyId);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
