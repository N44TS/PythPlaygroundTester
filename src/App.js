import React, { useState } from "react";
import { ethers } from "ethers";
// import MyAbi from "./utils/SomeContractAbi.json"; //the abi for my own contract
import PythAbi from "./utils/pythABI.json"; // The Pyth contract ABI from Pyth itself
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";

function App() {
  // const contractAddress = "0x5b52675E9Db145a454e880999CC7d070f3c149C0"; //mycontracts address
  const pythContractAddress = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"; // Pyth modetestnet contract address

  const [priceData, setPriceData] = useState(""); // Add state to hold price data

  const updatePrice = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const pythContract = new ethers.Contract(
        pythContractAddress,
        PythAbi,
        signer
      );

      // Establish a connection to the Pyth Hermes API
      const connection = new EvmPriceServiceConnection(
        "https://hermes.pyth.network"
      );

      // Specify the price feed IDs you're interested in, this is btc/usd
      const priceIds = [
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      ];

      // Fetch the latest price feed update data
      const updateData = await connection.getPriceFeedsUpdateData(priceIds);
      console.log("Update data fetched:", updateData);

      // Fetch the update fee using the updateData
      const fee = await pythContract.getUpdateFee(updateData);
      console.log("Update fee required:", ethers.formatEther(fee), "ETH");

      // Send the transaction with the update data and fee
      const tx = await pythContract.updatePriceFeeds(updateData, {
        value: fee,
      });
      await tx.wait(); // Wait for the transaction to be mined
      console.log("Price feed updated");

      const priceId =
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; //btc to usd price id

      // call to get the latest price that we just hopefully updated
      const priceData = await pythContract.getPrice(priceId);
      console.log("Updated Price Data:", priceData);

      // very basic price formatting
      // const adjustedPrice = ethers.formatUnits(priceData.price, priceData.expo);

      //   setPriceData(`Price: ${adjustedPrice}`);
      // } catch (error) {
      //   console.error("Failed to update price:", error);
      // }

      // a bit more price formating for human readability
      const adjustedPrice = {
        price: priceData.price.toString(),
        priceconvertedto$: (
          Number(priceData.price) * Math.pow(10, Number(priceData.expo))
        ).toFixed(0),
        conf: priceData.conf.toString(),
        expo: priceData.expo.toString(),
        publishTime: priceData.publishTime.toString(),
      };
      setPriceData(JSON.stringify(adjustedPrice, null, 2));
    } catch (error) {
      console.error("Failed to fetch price:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={updatePrice}>
          Update Price (opens MM to pay the fee){" "}
        </button>
        <p>Raw Price Data:</p>
        <pre>{priceData}</pre>
      </header>
    </div>
  );
}

export default App;
