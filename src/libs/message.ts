import { Block, KnownBlock } from "@slack/web-api";
import { formatJSONResponse } from "./api-gateway";

export function generateSlackBlockMessageResponse(
  statusCode: number,
  message: {
    response_type?: string;
    blocks: (KnownBlock | Block)[];
  }
) {
  return formatJSONResponse(statusCode, message);
}
