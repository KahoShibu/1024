import React, { useState } from "react";
import { useGame1024 } from "./hooks/useGame1024";
import { useScoreBoard } from "./hooks/useScoreBoard";
import { GameBoard } from "./components/GameBoard";
import "./App.css";

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const DEFAULT_NICKNAME = "用户";

export default function App() {
  const game = useGame1024();
  const web3 = useScoreBoard();
  const [nickname, setNickname] = useState(DEFAULT_NICKNAME);
  const [submitResult, setSubmitResult] = useState(null);

  const handleSubmitScore = async () => {
    if (game.score <= 0) return;
    setSubmitResult(null);
    const result = await web3.submitScore(game.score, nickname.trim() || DEFAULT_NICKNAME);
    setSubmitResult(result.ok ? "success" : "error");
    if (result.ok) setTimeout(() => setSubmitResult(null), 3000);
  };

  const displayName = (list, addr, index) => {
    const nick = list.nicknames && list.nicknames[index];
    return (nick && String(nick).trim()) ? nick : shortAddress(addr);
  };

  const weekLabel =
    web3.currentWeekId != null
      ? `第 ${web3.currentWeekId} 周`
      : "";
  const monthLabel =
    web3.currentMonthId != null
      ? `第 ${web3.currentMonthId} 月`
      : "";

  return (
    <div className="app">
      <header className="header">
        <h1>1024</h1>
        <p className="subtitle">Base 链上分数 · 达成 1024 即胜利</p>

        <div className="scores">
          <div className="score-box">
            <span className="label">分数</span>
            <span className="value">{game.score}</span>
          </div>
          <div className="score-box">
            <span className="label">最佳</span>
            <span className="value">{game.bestScore}</span>
          </div>
          {web3.myBestOnChain != null && web3.myBestOnChain > 0 && (
            <div className="score-box onchain">
              <span className="label">链上最佳</span>
              <span className="value">{web3.myBestOnChain}</span>
            </div>
          )}
        </div>

        <div className="nickname-row">
          <label className="nickname-label">
            昵称
            <input
              type="text"
              className="nickname-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder={DEFAULT_NICKNAME}
              maxLength={20}
            />
          </label>
        </div>
        <div className="wallet-row">
          {!web3.account ? (
            <button className="btn btn-connect" onClick={web3.connect} disabled={web3.loading}>
              {web3.loading ? "连接中…" : "连接钱包"}
            </button>
          ) : (
            <>
              <span className="addr">{shortAddress(web3.account)}</span>
              {!web3.isBase && (
                <button className="btn btn-small" onClick={web3.switchToBase}>
                  切换到 Base
                </button>
              )}
            </>
          )}
        </div>
        {web3.error && <p className="error-msg">{web3.error}</p>}
      </header>

      <main className="main">
        <GameBoard grid={game.grid} />

        <div className="actions">
          <button className="btn btn-primary" onClick={game.reset}>
            新游戏
          </button>
          {web3.account && web3.isBase && game.score > 0 && (
            <button
              className="btn btn-submit"
              onClick={handleSubmitScore}
              disabled={web3.txPending || game.score <= (web3.myBestOnChain || 0)}
            >
              {web3.txPending ? "上链中…" : "分数上链"}
            </button>
          )}
        </div>
        {submitResult === "success" && <p className="success-msg">分数已上链</p>}
        {submitResult === "error" && <p className="error-msg">上链失败，请查看上方提示</p>}

        {(game.won || game.gameOver) && (
          <div className="overlay-msg">
            {game.won ? "🎉 达成 1024！" : "游戏结束"}
            <button className="btn btn-primary" onClick={game.reset}>
              再玩一局
            </button>
          </div>
        )}
      </main>

      <section className="leaderboard-section">
        {!web3.contractAddress ? (
          <div className="leaderboard">
            <h2>排行榜 (Base)</h2>
            <p className="dim">部署合约后设置 VITE_SCOREBOARD_ADDRESS 以显示排行榜</p>
          </div>
        ) : (
          <>
            <div className="leaderboard">
              <h2>本周榜单 {weekLabel && <span className="week-tag">{weekLabel}</span>}</h2>
              {web3.weeklyLeaderboard.players.length === 0 ? (
                <p className="dim">本周暂无记录</p>
              ) : (
                <ol className="leader-list">
                  {web3.weeklyLeaderboard.players.map((addr, i) => (
                    <li key={`w-${addr}-${i}`}>
                      <span className="rank">{i + 1}</span>
                      <span className="name">{displayName(web3.weeklyLeaderboard, addr, i)}</span>
                      <span className="score">{web3.weeklyLeaderboard.scores[i]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="leaderboard">
              <h2>本月榜单 {monthLabel && <span className="month-tag">{monthLabel}</span>}</h2>
              {web3.monthlyLeaderboard.players.length === 0 ? (
                <p className="dim">本月暂无记录</p>
              ) : (
                <ol className="leader-list">
                  {web3.monthlyLeaderboard.players.map((addr, i) => (
                    <li key={`m-${addr}-${i}`}>
                      <span className="rank">{i + 1}</span>
                      <span className="name">{displayName(web3.monthlyLeaderboard, addr, i)}</span>
                      <span className="score">{web3.monthlyLeaderboard.scores[i]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="leaderboard">
              <h2>总榜</h2>
              {web3.leaderboard.players.length === 0 ? (
                <p className="dim">暂无记录，成为第一个上链分数吧</p>
              ) : (
                <ol className="leader-list">
                  {web3.leaderboard.players.map((addr, i) => (
                    <li key={`a-${addr}-${i}`}>
                      <span className="rank">{i + 1}</span>
                      <span className="name">{displayName(web3.leaderboard, addr, i)}</span>
                      <span className="score">{web3.leaderboard.scores[i]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        <p>使用方向键或滑动操作 · 相同数字合并 · 目标 1024</p>
      </footer>
    </div>
  );
}
