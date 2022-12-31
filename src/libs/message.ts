import { Block, KnownBlock } from "@slack/web-api";
import { formatJSONResponse } from "./api-gateway";

export function generateSlackBlockMessageResponse(
  statusCode: number,
  message: {
    blocks: (KnownBlock | Block)[];
  }
) {
  return formatJSONResponse(statusCode, message);
}
