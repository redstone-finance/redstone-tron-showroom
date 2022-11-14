import { useState, useEffect } from "react";
import { BigNumber, providers } from "ethers";
// import Web3Modal from "web3modal";
import { ChainDetails, chains } from "../config/chains";
import { emptyPrices } from "../utils";

type NetworkToAdd = Omit<
  ChainDetails,
  "exampleContractAddress" | "contractExplorerUrl" | "logo" | "label"
>;

export const useWeb3Modal = () => {
  const [prices, setPrices] = useState(emptyPrices);
  // const [tronWeb, setTronWeb] = useState<any | null>(null);
  const [network, setNetwork] = useState<ChainDetails | null>(null);
  const [signer, setSigner] = useState<providers.JsonRpcSigner | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // const web3Modal = new Web3Modal({
    //   cacheProvider: true,
    // });
    // setWeb3Modal(web3Modal);
  }, []);

  useEffect(() => {
    changeNetwork();
  }, [network]);

  // function getTronweb(){
  //   setIsConnecting(true);
  //   var obj = setInterval(async ()=>{
  //       if ((window  as any).tronWeb && (window  as any).tronWeb.defaultAddress.base58) {
  //           clearInterval(obj);
  //           // setTronWeb((window  as any).tronWeb);
            
  //           const walletAddress = (window  as any).tronWeb.defaultAddress.base58;
  //           setWalletAddress(walletAddress);
  //           setIsConnecting(false);
  //           setPrices(emptyPrices);
  //           setNetwork(chains[1]);
  //           setSigner("hehe" as any);
  //           // alert("Yes, catch it: " + walletAddress);
  //       }
  //   }, 10);
  // }

  async function getTronweb() {
    let tronWeb;
    setIsConnecting(true);
    const wdw = window as any;
    if (wdw.tronLink.ready) {
      tronWeb = wdw.tronWeb;
    } else {
      const res = await wdw.tronLink.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        tronWeb = wdw.tronLink.tronWeb;
      }
    }
    setVarsAfterGettingTronweb();
    return tronWeb;
  }

  function setVarsAfterGettingTronweb() {
    const wdw = window as any;
    const tronWeb = wdw.tronWeb;
    const walletAddress = tronWeb.defaultAddress.base58;
    setWalletAddress(walletAddress);
    setIsConnecting(false);
    setPrices(emptyPrices);
    setNetwork(chains[1]);
    setSigner("hehe" as any);
  }

  const changeNetwork = async () => {
    if (network) {
      setIsChangingNetwork(true);
      const {
        exampleContractAddress,
        contractExplorerUrl,
        logo,
        label,
        ...restNetworkParams
      } = network;
      try {
        // await window.ethereum.request({
        //   method: "wallet_switchEthereumChain",
        //   params: [{ chainId: restNetworkParams.chainId }],
        // });
        setIsChangingNetwork(false);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await addNewNetwork(restNetworkParams);
          setIsChangingNetwork(false);
        }
      } finally {
        setPrices(emptyPrices);
      }
    }
  };

  const addNewNetwork = async (networkParams: NetworkToAdd) => {
    // try {
    //   await window.ethereum.request({
    //     method: "wallet_addEthereumChain",
    //     params: [networkParams],
    //   });
    // } catch {
    //   setPrices(emptyPrices);
    // }
  };

  const connectWallet = async () => {
    // alert("Connecting wallet");
    getTronweb();
    // if (web3Modal) {
    //   try {
    //     setIsConnecting(true);
    //     const instance = await web3Modal.connect();
    //     addListeners(instance);
    //     const provider = new providers.Web3Provider(instance);
    //     const signer = provider.getSigner();
    //     setSigner(signer);
    //     const walletAddress = await signer.getAddress();
    //     setWalletAddress(walletAddress);
    //   } catch (error: any) {
    //     console.error(error);
    //   } finally {
    //     setIsConnecting(false);
    //     setPrices(emptyPrices);
    //   }
    // }
  };

  const reconnectWallet = async () => {
    // if (web3Modal) {
    //   const instance = await web3Modal.connect();
    //   const provider = new providers.Web3Provider(instance);
    //   const signer = provider.getSigner();
    //   setSigner(signer);
    //   const walletAddress = await signer.getAddress();
    //   setWalletAddress(walletAddress);
    // }
  };

  const addListeners = (web3ModalProvider: any) => {
    web3ModalProvider.on("accountsChanged", () => {
      window.location.reload();
    });

    web3ModalProvider.on("chainChanged", async (chainId: BigNumber) => {
      const chainIdAsNumber = Number(chainId.toString());
      const chainFromConfig = chains[chainIdAsNumber as keyof typeof chains];
      if (!chainFromConfig) {
        setNetwork(null);
      } else {
        setNetwork(chainFromConfig);
        await reconnectWallet();
      }
    });
  };

  return {
    prices,
    setPrices,
    network,
    setNetwork,
    signer,
    connectWallet,
    walletAddress,
    isChangingNetwork,
    isConnecting,
  };
};
