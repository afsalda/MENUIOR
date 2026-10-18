import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import PlayerEntry, { PlaySteps } from "./PlayerEntry";
import { readPlayer } from "../lib/player";
import Games, { games } from "./Games";
import GameScreen from "./GameScreen";
import "./Landing.css";

export default function GamesPage() {
  const [player, setPlayer] = useState(readPlayer);
  const [editing, setEditing] = useState(false);
  const game = games.find(
    (item) => item.id === new URLSearchParams(location.search).get("game"),
  );
  if (!player || editing)
    return (
      <PlayerEntry
        initial={player}
        onContinue={(next) => {
          setPlayer(next);
          setEditing(false);
        }}
        onCancel={player ? () => setEditing(false) : undefined}
      />
    );
  if (game) return <GameScreen game={game} />;
  return (
    <div className="games-page">
      <header className="games-page-header">
        <a href="/" aria-label="Menuoir home">
          menuoir.
        </a>
        <a href="/">
          <ArrowLeft size={16} /> Back
        </a>
      </header>
      <main>
        <div className="arcade-player">
          <PlaySteps current={2} />
          <div className="arcade-player-line">
            <span>Welcome, {player.name}.</span>
            <button onClick={() => setEditing(true)}>
              Edit player details
            </button>
          </div>
        </div>
        <Games />
      </main>
    </div>
  );
}
