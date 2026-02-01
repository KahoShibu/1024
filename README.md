# 1024 · Base 链上分数小游戏

基于 **Base** 链的 1024 小游戏，支持将分数上传到链上并查看排行榜。

## 技术栈

- **前端**: React 18 + Vite 5 + ethers.js 6
- **合约**: Solidity 0.8.20，Hardhat 编译与部署
- **链**: Base Mainnet (chainId 8453) / Base Sepolia (84532)

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npm run compile
```

### 3. 部署合约（可选）

复制 `.env.example` 为 `.env`，填入 `PRIVATE_KEY`（用于部署的钱包私钥）。

- Base 主网：`npm run deploy:base`
- Base Sepolia 测试网：`npm run deploy:base-sepolia`

部署成功后控制台会打印合约地址。

### 4. 前端配置合约地址

在项目根目录创建 `.env`，写入：

```env
VITE_SCOREBOARD_ADDRESS=你的合约地址
```

若不设置，游戏仍可正常玩，但「分数上链」和「排行榜」不可用。

### 5. 启动前端

```bash
npm run dev
```

浏览器打开 Vite 给出的地址（如 http://localhost:5173），连接 MetaMask 并切换到 Base 网络即可玩游戏并提交分数。

## 游戏规则

- 4×4 格子，方向键或滑动操作
- 相同数字合并，目标达成 **1024**
- 分数为棋盘上所有数字之和
- 仅当当前分数 **高于你在链上的历史最佳** 时，可点击「分数上链」写入 Base
- 合约内保留前 10 名排行榜

## 项目结构

```
1024/
├── contracts/
│   └── ScoreBoard.sol    # 分数上链合约
├── scripts/
│   └── deploy.js         # 部署脚本
├── src/
│   ├── abi/
│   │   └── ScoreBoard.json
│   ├── components/
│   │   ├── GameBoard.jsx
│   │   └── GameBoard.css
│   ├── hooks/
│   │   ├── useGame1024.js   # 1024 游戏逻辑
│   │   └── useScoreBoard.js # 钱包 + 合约交互
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

## Base 网络信息

| 网络       | Chain ID | RPC                    |
|------------|----------|------------------------|
| Base 主网  | 8453     | https://mainnet.base.org |
| Base Sepolia | 84532  | https://sepolia.base.org  |

钱包中若无 Base 网络，连接后点击「切换到 Base」会引导添加。

## License

MIT
