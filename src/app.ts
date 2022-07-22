import dotenv from "dotenv";
dotenv.config();
import { ORIGIN, PROTOCOL, SERVER_PORT } from "./utils/Constants";
import cors from "cors";
import * as express from "express";
import * as http from "http";
import * as SocketIO from "socket.io";
import bodyParser from "body-parser";
import { Matchmaking } from "./Matchmaking";
import {
  ProfileRoute,
  HistoryRoute,
  DraftRoute,
  StatsRoute,
  TeamRoute,
  LadderRoute,
  PanelRoute,
  ModerationRoute,
  HistoryMiddleware,
  ProfileMiddleware,
  TeamMiddleware,
  StatsMiddleware,
  ModerationMiddleware,
  PanelMiddleware,
  LadderMiddleware,
  MatchmakingMiddleware,
  MatchmakingRoute,
} from "./api/endpoint/route";
import { flex_limiter, main_limiter } from "./api/utils/Limiter";

export const matchmaking = new Matchmaking();

const app = express.default();
app.use(
  cors({
    origin: ORIGIN,
    optionsSuccessStatus: 200,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (_, res) => {
  res.send({ message: process.uptime() });
});

app.use("/profile", main_limiter, ProfileMiddleware, ProfileRoute);
app.use("/history", flex_limiter, HistoryMiddleware, HistoryRoute);
app.use("/draft", flex_limiter, DraftRoute);
app.use("/stats", main_limiter, StatsMiddleware, StatsRoute);
app.use("/team", main_limiter, TeamMiddleware, TeamRoute);
app.use("/ladder", main_limiter, LadderMiddleware, LadderRoute);
app.use("/panel", PanelMiddleware, PanelRoute);
app.use("/moderation", ModerationMiddleware, ModerationRoute);
app.use("/matchmaking", main_limiter, MatchmakingMiddleware, MatchmakingRoute);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

//

const server = http.createServer(app);
const io = new SocketIO.Server(server, {
  cors: {
    origin: ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  matchmaking.connect(socket);
  socket.on(PROTOCOL.RESPONSE_RECONNECTION, async (data) => {
    (socket as any).customId = data.uuid;
    await matchmaking.reconnect(socket);
  });
  socket.on(PROTOCOL.REGISTER, async (data) => {
    (socket as any).customId = data.uuid;
    (socket as any).adressIp = data.ip;
    await matchmaking.loggin(socket);
  });

  socket.on(PROTOCOL.RESPONSE_CONFIRM, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.RESPONSE_CONFIRM, data, socket);
  });

  socket.on(PROTOCOL.RESPONSE_URL, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.RESPONSE_URL, data, socket);
  });

  socket.on(PROTOCOL.RESPONSE_VALIDATE, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.RESPONSE_VALIDATE, data, socket);
  });

  socket.on(PROTOCOL.RESPONSE_OVER, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.RESPONSE_OVER, data, socket);
  });

  socket.on(PROTOCOL.FORFEIT, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.FORFEIT, data, socket);
  });

  socket.on(PROTOCOL.QUIT_QUEUE, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.QUIT_QUEUE, data, socket);
  });

  socket.on(PROTOCOL.FORCEQUIT, async (data) => {
    await matchmaking.lobbyResponse(PROTOCOL.FORCEQUIT, data, socket);
  });

  socket.on("disconnect", async () => {
    await matchmaking.disconnect(socket);
    socket.removeAllListeners();
  });
});

server.listen(SERVER_PORT, () => {
  console.log(`Running at localhost:${SERVER_PORT}`);
});
