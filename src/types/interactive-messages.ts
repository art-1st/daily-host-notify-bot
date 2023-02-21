interface SlackInteractiveMessageCommonPayload {
  type: string;
  token: string;
  team: {
    id: string;
    domain: string;
  };
  user: {
    id: string;
    name: string;
  };
  channel: {
    id: string;
    name: string; // privategroup
  };
  is_enterprise_install: boolean;
  enterprise: any;
  state: string;
  callback_id: string;
}

interface InteractiveMessageDialogSubmissionPayload<
  T = {
    [k: string]: string;
  }
> extends SlackInteractiveMessageCommonPayload {
  submission: T;
  response_url: string;
}
