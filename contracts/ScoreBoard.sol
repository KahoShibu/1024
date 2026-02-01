// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScoreBoard
 * @dev 1024 游戏分数上链 - 基于 Base 链
 */
contract ScoreBoard {
    struct Entry {
        address player;
        uint256 score;
    }

    uint256 public constant MAX_LEADERBOARD = 10;

    mapping(address => uint256) public bestScore;
    Entry[MAX_LEADERBOARD] public topScores;

    event ScoreSubmitted(address indexed player, uint256 score, bool isNewRecord);

    /**
     * @dev 提交分数，仅当高于个人历史最佳时更新
     */
    function submitScore(uint256 score) external {
        require(score > 0, "Score must be positive");
        uint256 prev = bestScore[msg.sender];
        require(score > prev, "Score not higher than your best");

        bestScore[msg.sender] = score;
        _updateLeaderboard(msg.sender, score);
        emit ScoreSubmitted(msg.sender, score, true);
    }

    function _updateLeaderboard(address player, uint256 score) internal {
        int256 insertAt = -1;
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            if (topScores[i].score < score) {
                insertAt = int256(i);
                break;
            }
        }
        if (insertAt < 0) return;

        uint256 pos = uint256(insertAt);
        for (uint256 j = MAX_LEADERBOARD - 1; j > pos; j--) {
            topScores[j] = topScores[j - 1];
        }
        topScores[pos] = Entry({ player: player, score: score });
    }

    /**
     * @dev 获取排行榜
     */
    function getLeaderboard() external view returns (address[MAX_LEADERBOARD] memory players, uint256[MAX_LEADERBOARD] memory scores) {
        for (uint256 i = 0; i < MAX_LEADERBOARD; i++) {
            players[i] = topScores[i].player;
            scores[i] = topScores[i].score;
        }
    }

    /**
     * @dev 获取当前用户最佳分数
     */
    function getMyBestScore(address account) external view returns (uint256) {
        return bestScore[account];
    }
}
