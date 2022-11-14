import { useState, Dispatch, SetStateAction } from "react";
import { utils, providers, Contract, BigNumber } from "ethers";
import { WrapperBuilder } from "redstone-evm-connector";
import { emptyPrices } from "../utils";
import { ChainDetails } from "../config/chains";
import { abi } from "../config/ExampleRedstoneShowroomDetails.json";
import { usePricesData } from "./usePricesData";
import { Prices } from "../types";
import redstoneSDK from "redstone-sdk";
import redstoneProtocol from "redstone-protocol"
import { hexlify } from "ethers/lib/utils";
import axios from "axios";
import redstoneApi from "redstone-api";

const redstoneCacheServiceUrls = [
  "https://cache-service-direct-1.b.redstone.finance",
  "https://d33trozg86ya9x.cloudfront.net"
];

export const usePricesFromContract = (
  network: ChainDetails | null,
  signer: providers.JsonRpcSigner | null,
  startMockLoader: () => void,
  setPrices: Dispatch<SetStateAction<Prices>>,
  setIsMockLoading: Dispatch<SetStateAction<boolean>>
) => {
  const [blockNumber, setBlockNumber] = useState(0);
  const [timestamp, setTimestamp] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // const { getPricesTimestamp } = usePricesData();

  async function getCurrentTronNileBlockNUmber() {
    const curBlock = await (window as any).tronWeb.trx.getCurrentBlock();
    return curBlock.block_header.raw_data.number;
  }

  function extractPrice(signedOracleDataPackage: redstoneProtocol.SignedDataPackage, symbol: string) {
    for (const dataPoint of signedOracleDataPackage.dataPackage.dataPoints) {
      if (dataPoint.dataFeedId === symbol) {
        const bytesValue = dataPoint.value;
        const bigNum = BigNumber.from(bytesValue);
        return String(bigNum.toNumber() / 10 ** 8);
      }
    }

    return "42";
  }

  async function getPriceOfBAYC() {
    const url = "https://api.redstone.finance/packages/latest?provider=redstone-custom-urls-1";
    const id = "0x60cbe6b18347697f";
    const response = await axios.get(url, {
      params: {
        symbol: id
      }
    });
    const ethPrice = await redstoneApi.getPrice("ETH");
    return String(response.data.prices[0].value * ethPrice.value);
  }

  async function getTempInNewYork() {
    const url = "https://api.redstone.finance/packages/latest?provider=redstone-custom-urls-1";
    const id = "0x354ddb8df9599621";
    const response = await axios.get(url, {
      params: {
        symbol: id
      }
    });
    return String(response.data.prices[0].value);
  }

  async function getTrxPriceFromRealContract() {
    return String(0.05);
  }

  const getPricesFromContract = async () => {
    startMockLoader();
    setIsLoading(true);

    const blockNumber = await getCurrentTronNileBlockNUmber();
    setBlockNumber(blockNumber);

    const oracleResponse = await redstoneSDK.requestDataPackages({
      dataServiceId: "redstone-main-demo",
      uniqueSignersCount: 1,
    }, redstoneCacheServiceUrls);
    const signedOracleDataPackage = oracleResponse.___ALL_FEEDS___[0];

    const timestamp = signedOracleDataPackage.dataPackage.timestampMilliseconds;

    setTimestamp(timestamp);
    setIsLoading(false);

    const pricesObj = {
      trx: await getTrxPriceFromRealContract(),
      jst: extractPrice(signedOracleDataPackage, "JST"),
      btc: extractPrice(signedOracleDataPackage, "BTC"),
      eth: extractPrice(signedOracleDataPackage, "ETH"),
      bnb: extractPrice(signedOracleDataPackage, "BNB"),
      nyc_temperature: await getTempInNewYork(),
      bayc_nft_floor_price: await getPriceOfBAYC(),
    };

    console.log({pricesObj});

    setPrices(pricesObj);


    // if (network && signer) {
    //   try {
    //     startMockLoader();
    //     setIsLoading(true);
    //     const contractAddress = network.exampleContractAddress;
    //     if (contractAddress) {
    //       const prices = await fetchPrices(contractAddress, signer);
    //       setPrices({
    //         btc: utils.formatUnits(prices[0], 8),
    //         eth: utils.formatUnits(prices[1], 8),
    //         bnb: utils.formatUnits(prices[2], 8),
    //         ar: utils.formatUnits(prices[3], 8),
    //         avax: utils.formatUnits(prices[4], 8),
    //         celo: utils.formatUnits(prices[5], 8),
    //       });
    //       const blockNumber = await signer.provider.getBlockNumber();
    //       setBlockNumber(blockNumber);
    //       const timestamp = await getPricesTimestamp();
    //       setTimestamp(timestamp);
    //       setIsLoading(false);
    //     }
    //   } catch (error) {
    //     console.error(error);
    //     handleError();
    //   }
    // } else {
    //   handleError();
    // }
  };

  const fetchPrices = async (
    contractAddress: string,
    signer: providers.JsonRpcSigner
  ) => {
    const contract = new Contract(contractAddress, abi, signer);
    const wrappedContract =
      WrapperBuilder.wrapLite(contract).usingPriceFeed("redstone-rapid");
    return await wrappedContract.getPrices();
  };

  const handleError = () => {
    setIsLoading(false);
    setPrices(emptyPrices);
    setIsMockLoading(false);
    setErrorMessage(
      "There was problem with fetching data from smart contract. Please try again or contact RedStone team"
    );
  };

  return {
    blockNumber,
    timestamp,
    isLoading,
    errorMessage,
    setErrorMessage,
    getPricesFromContract,
  };
};
