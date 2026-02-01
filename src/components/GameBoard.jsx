import React from "react";
import "./GameBoard.css";

const TILE_COLORS = {
  0: "tile-0",
  2: "tile-2",
  4: "tile-4",
  8: "tile-8",
  16: "tile-16",
  32: "tile-32",
  64: "tile-64",
  128: "tile-128",
  256: "tile-256",
  512: "tile-512",
  1024: "tile-1024",
  2048: "tile-1024",
};

function Tile({ value }) {
  const n = value || 0;
  const cls = TILE_COLORS[n] ?? "tile-1024";
  return (
    <div className={`tile ${cls}`}>
      {n > 0 ? n : ""}
    </div>
  );
}

export function GameBoard({ grid }) {
  return (
    <div className="game-board">
      <div className="grid">
        {grid.map((row, r) =>
          row.map((val, c) => (
            <Tile key={`${r}-${c}`} value={val} />
          ))
        )}
      </div>
    </div>
  );
}
