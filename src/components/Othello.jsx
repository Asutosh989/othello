import { useEffect, useMemo, useState } from "react";
import { OthelloGame, Players } from "../lib/OthelloGame";
import "./othello.css";
import { deepClone } from "../helpers";
import { MdRefresh, MdUndo, MdLightbulbOutline } from "react-icons/md";
import { DialogBox } from "./Dialog";

const countPieces = (board) => {
  let black = 0;
  let white = 0;
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell.takenBy === Players.BLACK) black += 1;
      if (cell.takenBy === Players.WHITE) white += 1;
    })
  );
  return { black, white };
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const Othello = () => {
  const [othelloGame, setOthelloGame] = useState(new OthelloGame());
  const [history, setHistory] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [showHints, setShowHints] = useState(true);
  const [toast, setToast] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { black, white } = countPieces(othelloGame.board);
  const isEnded = othelloGame.status === "ENDED";
  const isDraw = isEnded && !othelloGame.winner;
  const turn = othelloGame.currentTurn;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Cells that would flip if the current player played the hovered cell
  const previewFlips = useMemo(() => {
    if (!hoveredCell || isEnded) return {};
    const { rowIndex, colIndex } = hoveredCell;
    if (!othelloGame.playableCells[rowIndex + "_" + colIndex]) return {};
    const cells = othelloGame.initiateFlipsFrom(rowIndex, colIndex, turn);
    return Object.fromEntries(cells.map((c) => [c.i + "_" + c.j, true]));
  }, [hoveredCell, othelloGame, turn, isEnded]);

  const restartGame = () => {
    setOthelloGame(new OthelloGame());
    setHistory([]);
    setLastMove(null);
    setFlipped({});
  };

  const handleClick = (i, j) => {
    if (isEnded || othelloGame.board[i][j].takenBy) return;
    if (!othelloGame.playableCells[i + "_" + j]) return;

    const mover = othelloGame.currentTurn;
    const flips = othelloGame.initiateFlipsFrom(i, j, mover);
    const next = deepClone(othelloGame);
    next.playCell(i, j);

    setHistory([...history, { game: othelloGame, lastMove, flipped }]);
    setOthelloGame(next);
    setLastMove(i + "_" + j);
    setFlipped(Object.fromEntries(flips.map((c) => [c.i + "_" + c.j, true])));
    setHoveredCell(null);

    if (next.status === "ACTIVE" && next.currentTurn === mover) {
      const other = mover === Players.BLACK ? Players.WHITE : Players.BLACK;
      setToast(`${capitalize(other)} has no moves, so ${capitalize(mover)} plays again`);
    }
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setOthelloGame(prev.game);
    setLastMove(prev.lastMove);
    setFlipped({});
    setHistory(history.slice(0, -1));
  };

  const renderCell = (cell, i, j) => {
    const key = i + "_" + j;
    const playable = !isEnded && othelloGame.playableCells[key];
    const isHovered = hoveredCell?.rowIndex === i && hoveredCell?.colIndex === j;
    const classes = ["grid-cell"];
    if (playable) classes.push("playable");
    if (lastMove === key) classes.push("last-move");

    let content = null;
    if (cell.takenBy) {
      const discClasses = ["disc", cell.takenBy];
      if (lastMove === key) discClasses.push("placed");
      else if (flipped[key]) discClasses.push("flipped");
      if (previewFlips[key]) discClasses.push("will-flip");
      content = <div key={cell.takenBy} className={discClasses.join(" ")} />;
    } else if (playable && isHovered) {
      content = <div className={`disc ghost ${turn}`} />;
    } else if (playable && showHints) {
      content = <div className={`hint ${turn}`} />;
    }

    return (
      <div
        key={j}
        className={classes.join(" ")}
        onClick={() => handleClick(i, j)}
        onMouseEnter={() => setHoveredCell({ rowIndex: i, colIndex: j })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {content}
      </div>
    );
  };

  const total = black + white;
  return (
    <div className="othello">
      <header className="header-container">
        <h1>Othello</h1>
        <div className="toolbar">
          <button
            className="icon-button"
            onClick={handleUndo}
            disabled={!history.length}
            title="Undo"
          >
            <MdUndo />
          </button>
          <button
            className={`icon-button ${showHints ? "active" : ""}`}
            onClick={() => setShowHints(!showHints)}
            title="Toggle move hints"
          >
            <MdLightbulbOutline />
          </button>
          <button
            className="icon-button"
            onClick={() => setIsDialogOpen(true)}
            title="Restart"
          >
            <MdRefresh />
          </button>
        </div>
      </header>

      <div className="scoreboard">
        {[Players.BLACK, Players.WHITE].map((p) => (
          <div
            key={p}
            className={`player-card ${p} ${!isEnded && turn === p ? "active" : ""} ${
              isEnded && othelloGame.winner === p ? "winner" : ""
            }`}
          >
            <div className={`disc mini ${p}`} />
            <div className="player-info">
              <span className="player-name">{capitalize(p)}</span>
              <span className="player-status">
                {isEnded
                  ? othelloGame.winner === p
                    ? "Winner!"
                    : isDraw
                    ? "Draw"
                    : ""
                  : turn === p
                  ? "Your move"
                  : "Waiting"}
              </span>
            </div>
            <span className="player-score">{p === Players.BLACK ? black : white}</span>
          </div>
        ))}
      </div>

      <div className="score-bar">
        <div className="score-bar-black" style={{ width: `${(black / total) * 100}%` }} />
      </div>

      <div className="board-wrapper">
        <div className="grid-container">
          {othelloGame.board.map((row, i) => (
            <div key={i} className="grid-row">
              {row.map((cell, j) => renderCell(cell, i, j))}
            </div>
          ))}
        </div>

        {isEnded && (
          <div className="game-over">
            <div className="game-over-card">
              <h2>{isDraw ? "It's a draw!" : `${capitalize(othelloGame.winner)} wins!`}</h2>
              <p>
                {black} – {white}
              </p>
              <button className="button primary" onClick={restartGame}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}

      <DialogBox
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Restart game?"
        content="Your current progress will be lost."
        onConfirm={() => {
          restartGame();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
};
