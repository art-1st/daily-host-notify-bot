export interface CommandRequestPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  api_app_id: string;
  is_enterprise_install: string;
  response_url: string;
  trigger_id: string;
}

export enum CommandItem {
  SETUP = "/setup",
  INFO = "/info",
  USER_ADD = "/user-add",
  USER_REMOVE = "/user-remove",
}
