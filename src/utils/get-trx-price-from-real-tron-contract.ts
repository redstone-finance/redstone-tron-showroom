import axios from "axios";
import sdk from "redstone-sdk";
import { RedstonePayload } from "redstone-protocol";
import { convertStringToBytes32 } from "redstone-protocol/dist/src/common/utils";
import { AbiCoder, hexlify } from "ethers/lib/utils";

const nileTrongridApi = "https://nile.trongrid.io";
const ADDRESS_PREFIX_REGEX = /^(41)/;
const ADDRESS_PREFIX = "41";

// async function getRedstonePayload() {
//   return "";
// }

async function getRedstonePayload() {
  // Fetching oracle data from redstone decetrnalized data layer
  const signedDataPackagesResponse = await sdk.requestDataPackages(
    {
      dataServiceId: "redstone-main-demo",
      uniqueSignersCount: 1,
      dataFeeds: ["TRX"],
    },
    ["https://cache-service-direct-1.b.redstone.finance"]
  );

  // Parsing response
  const signedDataPackages = [];
  for (const dataFeedId of Object.keys(signedDataPackagesResponse)) {
    signedDataPackages.push(...signedDataPackagesResponse[dataFeedId]);
  }

  // Prepare redstone payload
  const unsignedMetadata = "tron-redstone-payload";
  const redstonePayload =
    "0x" + RedstonePayload.prepare(signedDataPackages, unsignedMetadata);

  return redstonePayload;
}

async function encodeParams(inputs: any) {
  let typesValues = inputs;
  let parameters = "";

  if (typesValues.length == 0) return parameters;
  const abiCoder = new AbiCoder();
  let types = [];
  const values = [];

  for (let i = 0; i < typesValues.length; i++) {
    let { type, value } = typesValues[i];
    if (type == "address") value = value.replace(ADDRESS_PREFIX_REGEX, "0x");
    types.push(type);
    values.push(value);
  }

  console.log(types, values);
  try {
    parameters = abiCoder.encode(types, values).replace(/^(0x)/, "");
  } catch (ex) {
    console.log(ex);
  }
  return parameters;
}

export async function getTrxPriceFromRealContract() {
  const redstonePayload = await getRedstonePayload();
  console.log({ redstonePayload });
  const TRX_B32 = hexlify(convertStringToBytes32("TRX"));
  console.log({ TRX_B32 });
  const parameters = await encodeParams([
    { type: "bytes", value: redstonePayload },
    { type: "bytes32", value: TRX_B32 },
  ]);

  console.log({ parameters });
  const response = await axios.post(
    `${nileTrongridApi}/wallet/triggerconstantcontract`,
    {
      contract_address: "419e5b86d0f3b66cb0bdc5a384b9e7ef326eb3ba46",
      function_selector: "getLatestPrice(bytes,bytes32)",
      parameter: parameters[0] + parameters[1],
      // parameter: "00",
      owner_address: "419e5b86d0f3b66cb0bdc5a384b9e7ef326eb3ba46",
    }
  );
  const contractCallResponse = response.data;
  // return response.data;
  console.log(contractCallResponse);
  return contractCallResponse;
}
