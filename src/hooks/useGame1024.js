import { useState, useCallback, useEffect } from "react";

const GRID_SIZE = 4;
const TARGET = 1024;

function randomTile() {
  return Math.random() < 0.9 ? 2 : 4;
}

function emptyGrid() {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = randomTile();
  return next;
}

function slideRow(row) {
  let filtered = row.filter((v) => v !== 0);
  const merged = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return merged;
}

function moveLeft(grid) {
  return grid.map((row) => slideRow(row));
}

function rotate90(grid) {
  const n = grid.length;
  const out = emptyGrid();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) out[c][n - 1 - r] = grid[r][c];
  }
  return out;
}

function moveRight(grid) {
  return grid.map((row) => slideRow([...row].reverse())).map((row) => row.reverse());
}

function moveUp(grid) {
  let rotated = rotate90(grid);
  rotated = moveLeft(rotated);
  return rotate90(rotate90(rotate90(rotated)));
}

function moveDown(grid) {
  let rotated = rotate90(rotate90(rotate90(grid)));
  rotated = moveLeft(rotated);
  return rotate90(rotated);
}

function sameGrid(a, b) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function maxTile(grid) {
  let max = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  return max;
}

function canMove(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

export function useGame1024() {
  const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(emptyGrid())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem("1024-best") || "0", 10);
    } catch {
      return 0;
    }
  });
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const computeScore = useCallback((g) => {
    let s = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) s += g[r][c];
    }
    return s;
  }, []);

  const tryMove = useCallback(
    (moveFn) => {
      if (gameOver) return;
      const next = moveFn(grid);
      if (sameGrid(grid, next)) return;
      const withNew = addRandomTile(next);
      setGrid(withNew);
      const newScore = computeScore(withNew);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          localStorage.setItem("1024-best", String(newScore));
        } catch (_) {}
      }
      if (maxTile(withNew) >= TARGET) setWon(true);
      if (!canMove(withNew)) setGameOver(true);
    },
    [grid, gameOver, bestScore, computeScore]
  );

  const moveLeftFn = useCallback(() => tryMove(moveLeft), [tryMove]);
  const moveRightFn = useCallback(() => tryMove(moveRight), [tryMove]);
  const moveUpFn = useCallback(() => tryMove(moveUp), [tryMove]);
  const moveDownFn = useCallback(() => tryMove(moveDown), [tryMove]);

  const reset = useCallback(() => {
    setGrid(addRandomTile(addRandomTile(emptyGrid())));
    setScore(0);
    setWon(false);
    setGameOver(false);
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (gameOver) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          moveLeftFn();
          break;
        case "ArrowRight":
          e.preventDefault();
          moveRightFn();
          break;
        case "ArrowUp":
          e.preventDefault();
          moveUpFn();
          break;
        case "ArrowDown":
          e.preventDefault();
          moveDownFn();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [moveLeftFn, moveRightFn, moveUpFn, moveDownFn, gameOver]);

  return {
    grid,
    score,
    bestScore,
    won,
    gameOver,
    moveLeft: moveLeftFn,
    moveRight: moveRightFn,
    moveUp: moveUpFn,
    moveDown: moveDownFn,
    reset,
    target: TARGET,
  };
}
