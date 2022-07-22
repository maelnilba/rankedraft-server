import { router as ProfileRoute } from "./profile/profile.route";
import { middleware as ProfileMiddleware } from "./profile/profile.middleware";
import { router as HistoryRoute } from "./history/history.route";
import { middleware as HistoryMiddleware } from "./history/history.middleware";
import { router as DraftRoute } from "./draft/draft.route";
import { router as StatsRoute } from "./stats/stats.route";
import { middleware as StatsMiddleware } from "./stats/stats.middleware";
import { router as TeamRoute } from "./team/team.route";
import { middleware as TeamMiddleware } from "./team/team.middleware";
import { router as LadderRoute } from "./ladder/ladder.route";
import { middleware as LadderMiddleware } from "./ladder/ladder.middleware";
import { router as PanelRoute } from "./panel/panel.route";
import { middleware as PanelMiddleware } from "./panel/panel.middleware";
import { router as ModerationRoute } from "./moderation/moderation.route";
import { middleware as ModerationMiddleware } from "./moderation/moderation.middleware";
import { router as MatchmakingRoute } from "./matchmaking/matchmaking.route";
import { middleware as MatchmakingMiddleware } from "./matchmaking/matchmaking.middleware";
export {
  ProfileRoute,
  ProfileMiddleware,
  HistoryRoute,
  HistoryMiddleware,
  DraftRoute,
  StatsRoute,
  StatsMiddleware,
  TeamRoute,
  TeamMiddleware,
  PanelRoute,
  PanelMiddleware,
  ModerationRoute,
  ModerationMiddleware,
  LadderRoute,
  LadderMiddleware,
  MatchmakingRoute,
  MatchmakingMiddleware,
};
