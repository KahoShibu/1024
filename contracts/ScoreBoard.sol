// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScoreBoard
 * @dev 1024 游戏分数上链 - 基于 Base 链，支持昵称、每周榜单与每月榜单
 */
contract ScoreBoard {
    struct Entry {
        address player;
        uint256 score;
        bytes32 nickname;
    }

    uint256 public constant MAX_LEADERBOARD = 10;
    uint256 public constant MAX_NICKNAME_BYTES = 31;
    uint256 public constant ONE_WEEK = 7 days;
    uint256 public constant ONE_MONTH = 30 days;

    mapping(address => uint256) public bestScore;
    mapping(address => bytes32) public nicknameOf;
    Entry[MAX_LEADERBOARD] public topScores;
    mapping(uint256 => Entry[MAX_LEADERBOARD]) public weeklyTopScores;   // weekId => top 10
    mapping(uint256 => Entry[MAX_LEADERBOARD]) public monthlyTopScores; // monthId => top 10

    event ScoreSubmitted(address indexed player, uint256 score, bytes32 nickname, bool isNewRecord);

    /**
     * @dev 当前周 ID（自 Unix 纪元起的周数）
     */
    function getCurrentWeekId() public view returns (uint256) {
        return block.timestamp / ONE_WEEK;
    }

    /**
     * @dev 当前月 ID（自 Unix 纪元起的月数，约 30 天为一月）
     */
    function getCurrentMonthId() public view returns (uint256) {
        return block.timestamp / ONE_MONTH;
    }

    /**
     * @dev 提交分数与昵称，仅当高于个人历史最佳时更新。同时更新总榜、本周榜与本月榜。
     */
    function submitScore(uint256 score, bytes32 _nickname) external {
        require(score > 0, "Score must be positive");
        uint256 prev = bestScore[msg.sender];
        require(score > prev, "Score not higher than your best");

        bestScore[msg.sender] = score;
        nicknameOf[msg.sender] = _nickname;
        uint256 weekId = getCurrentWeekId();
        uint256 monthId = getCurrentMonthId();

        _updateLeaderboard(topScores, msg.sender, score, _nickname);
        _updateLeaderboard(weeklyTopScores[weekId], msg.sender, score, _nickname);
        _updateLeaderboard(monthlyTopScores[monthId], msg.sender, score, _nickname);

        emit ScoreSubmitted(msg.sender, score, _nickname, true);
    }

    function _updateLeaderboard(
        Entry[MAX_LEADERBOARD] storage board,
        address player,
        uint256 score,
        bytes32 _nickname
    ) internal {
        int256 insertAt = -1;
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            if (board[i].score < score) {
                insertAt = int256(i);
                break;
            }
        }
        if (insertAt < 0) return;

        uint256 pos = uint256(insertAt);
        for (uint256 j = MAX_LEADERBOARD - 1; j > pos; j--) {
            board[j] = board[j - 1];
        }
        board[pos] = Entry({ player: player, score: score, nickname: _nickname });
    }

    /**
     * @dev 获取总榜（玩家、分数、昵称）
     */
    function getLeaderboard() external view returns (
        address[MAX_LEADERBOARD] memory players,
        uint256[MAX_LEADERBOARD] memory scores,
        bytes32[MAX_LEADERBOARD] memory nicknames
    ) {
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            players[i] = topScores[i].player;
            scores[i] = topScores[i].score;
            nicknames[i] = topScores[i].nickname;
        }
    }

    /**
     * @dev 获取指定周的周榜（玩家、分数、昵称）
     */
    function getWeeklyLeaderboard(uint256 weekId) external view returns (
        address[MAX_LEADERBOARD] memory players,
        uint256[MAX_LEADERBOARD] memory scores,
        bytes32[MAX_LEADERBOARD] memory nicknames
    ) {
        Entry[MAX_LEADERBOARD] storage board = weeklyTopScores[weekId];
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            players[i] = board[i].player;
            scores[i] = board[i].score;
            nicknames[i] = board[i].nickname;
        }
    }

    /**
     * @dev 获取指定月的月榜（玩家、分数、昵称）
     */
    function getMonthlyLeaderboard(uint256 monthId) external view returns (
        address[MAX_LEADERBOARD] memory players,
        uint256[MAX_LEADERBOARD] memory scores,
        bytes32[MAX_LEADERBOARD] memory nicknames
    ) {
        Entry[MAX_LEADERBOARD] storage board = monthlyTopScores[monthId];
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            players[i] = board[i].player;
            scores[i] = board[i].score;
            nicknames[i] = board[i].nickname;
        }
    }

    /**
     * @dev 获取当前用户最佳分数
     */
    function getMyBestScore(address account) external view returns (uint256) {
        return bestScore[account];
    }
}
