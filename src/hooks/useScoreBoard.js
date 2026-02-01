import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import ScoreBoardAbi from "../abi/ScoreBoard.json";

const BASE_MAINNET = { chainId: 8453, name: "Base Mainnet" };
const BASE_SEPOLIA = { chainId: 84532, name: "Base Sepolia" };

const CONTRACT_ADDRESS = import.meta.env.VITE_SCOREBOARD_ADDRESS || "";

export function useScoreBoard() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ players: [], scores: [] });
  const [myBestOnChain, setMyBestOnChain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState(null);

  const isBase = chainId === 8453 || chainId === 84532;
  const networkName = chainId === 84532 ? "Base Sepolia" : chainId === 8453 ? "Base" : null;

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("请安装 MetaMask 或其它 Web3 钱包");
      return;
    }
    setLoading(true);
    try {
      const prov = new BrowserProvider(window.ethereum);
      const accounts = await prov.send("eth_requestAccounts", []);
      const network = await prov.getNetwork();
      setProvider(prov);
      setAccount(accounts[0] ?? null);
      setChainId(Number(network.chainId));

      if (CONTRACT_ADDRESS) {
        const signer = await prov.getSigner();
        const c = new Contract(CONTRACT_ADDRESS, ScoreBoardAbi, signer);
        setContract(c);
      } else {
        setContract(null);
      }
    } catch (e) {
      setError(e.message || "连接失败");
      setAccount(null);
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }],
      });
      const prov = new BrowserProvider(window.ethereum);
      const network = await prov.getNetwork();
      setChainId(Number(network.chainId));
      setProvider(prov);
      if (CONTRACT_ADDRESS && account) {
        const signer = await prov.getSigner();
        setContract(new Contract(CONTRACT_ADDRESS, ScoreBoardAbi, signer));
      }
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x2105",
              chainName: "Base Mainnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            },
          ],
        });
      } else {
        setError(e.message || "切换网络失败");
      }
    }
  }, [account]);

  const switchToBaseSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }],
      });
      const prov = new BrowserProvider(window.ethereum);
      const network = await prov.getNetwork();
      setChainId(Number(network.chainId));
      setProvider(prov);
      if (CONTRACT_ADDRESS && account) {
        const signer = await prov.getSigner();
        setContract(new Contract(CONTRACT_ADDRESS, ScoreBoardAbi, signer));
      }
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x14a34",
              chainName: "Base Sepolia",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia-explorer.base.org"],
            },
          ],
        });
      } else {
        setError(e.message || "切换网络失败");
      }
    }
  }, [account]);

  const fetchLeaderboard = useCallback(async () => {
    if (!CONTRACT_ADDRESS || !provider) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, ScoreBoardAbi, provider);
      const [players, scores] = await c.getLeaderboard();
      const zero = "0x0000000000000000000000000000000000000000";
      const pairs = players
        .map((p, i) => [p, scores[i]])
        .filter(([p]) => p !== zero);
      setLeaderboard({
        players: pairs.map(([p]) => p),
        scores: pairs.map(([, s]) => Number(s)),
      });
    } catch (e) {
      console.warn("fetchLeaderboard", e);
    }
  }, [provider]);

  const fetchMyBest = useCallback(async () => {
    if (!CONTRACT_ADDRESS || !provider || !account) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, ScoreBoardAbi, provider);
      const best = await c.getMyBestScore(account);
      setMyBestOnChain(Number(best));
    } catch (e) {
      console.warn("fetchMyBest", e);
    }
  }, [provider, account]);

  const submitScore = useCallback(
    async (score) => {
      if (!contract || !isBase) {
        setError("请先连接钱包并切换到 Base 网络");
        return { ok: false };
      }
      if (score <= 0) {
        setError("分数必须大于 0");
        return { ok: false };
      }
      setError(null);
      setTxPending(true);
      try {
        const tx = await contract.submitScore(score);
        await tx.wait();
        await fetchMyBest();
        await fetchLeaderboard();
        return { ok: true };
      } catch (e) {
        const msg = e.reason || e.shortMessage || e.message || "提交失败";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setTxPending(false);
      }
    },
    [contract, isBase, fetchMyBest, fetchLeaderboard]
  );

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => setAccount(accounts[0] ?? null);
    const onChain = (id) => setChainId(Number(id));
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    if (CONTRACT_ADDRESS && provider) {
      fetchLeaderboard();
    }
  }, [provider, CONTRACT_ADDRESS, fetchLeaderboard]);

  useEffect(() => {
    if (account && CONTRACT_ADDRESS && provider) {
      fetchMyBest();
    }
  }, [account, provider, CONTRACT_ADDRESS, fetchMyBest]);

  return {
    account,
    chainId,
    isBase,
    networkName,
    contractAddress: CONTRACT_ADDRESS,
    leaderboard,
    myBestOnChain,
    loading,
    txPending,
    error,
    connect,
    switchToBase,
    switchToBaseSepolia,
    submitScore,
    fetchLeaderboard,
    fetchMyBest,
  };
}
