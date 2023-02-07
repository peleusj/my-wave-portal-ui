import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import { useEffect } from "react";
import { useState } from "react";

const contractAddress = "0x2C1E2229868290324B515cb7bfA69bD0BD07a4f0";
const contractABI = abi.abi;

const checkIfWalletIsConnected = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        return account;
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [newWave, setNewWave] = useState("");
  const [tip, setTip] = useState("");

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("You must install Metamask first!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.error(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await wavePortalContract.wave(newWave, { gasLimit: 300000 });
        setTip(
          <a target="_blank" rel="noopener noreferrer" href={`https://goerli.etherscan.io/tx/${waveTxn.hash}`}>
            Wave Processing, you can view it on etherscan
          </a>
        );

        await waveTxn.wait();
        setTip("Wave successfully.")

        setNewWave("");
      } else {
        setTip("Please connect your wallet first.")
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      const waves = await wavePortalContract.getAllWaves();
      const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });

      setAllWaves(wavesCleaned);

    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected().then((account) => {
      if (account != null) {
        setCurrentAccount(account);
        getAllWaves();
      }
    });
  }, [])

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="Waving Hand">👋</span> Hey there!
        </div>

        <div className="bio">
        You can wave at me on Goerli testnet network!
        </div>
        
        {currentAccount && (
          <input
            type="text"
            value={newWave}
            onChange={event => setNewWave(event.target.value)}
          />
        )}

        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave
          </button>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {tip && (
          <div className="tips">
            Tip: <span>{tip}</span>
          </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
