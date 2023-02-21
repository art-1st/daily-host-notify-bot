import { ChannelData } from "src/types/data";
import CommandError, { CommandErrorName } from "./command-error";

export class Channel {
  channel_id: string;
  users: string[];
  message_header: string;
  message_content: string;
  googlemeet_link: string;
  event_rule_arn: string;

  constructor(data: ChannelData) {
    this.channel_id = data.channel_id;
    this.users = this.parseUser(data.users);
    this.message_header = data.message_header ?? "";
    this.message_content = data.message_content ?? "";
    this.googlemeet_link = data.googlemeet_link ?? "";
    this.event_rule_arn = data.event_rule_arn ?? "";
  }

  hasUser(id: string) {
    return this.users.includes(id);
  }

  addUser(id: string, addFirst: boolean = false) {
    if (id.startsWith("U") && id.length === 11) {
      if (addFirst) {
        this.users.unshift(id);
      } else {
        this.users.push(id);
      }
    } else {
      throw new CommandError(CommandErrorName.COMMON_NOT_FOUND_USER);
    }
  }

  removeUser(id: string) {
    this.users = this.users.filter((user) => user !== id);
  }

  pickUserAndAdjust() {
    if (!this.users.length)
      throw new CommandError(CommandErrorName.COMMON_CHANNEL_NO_USERS);

    const now = this.users[0];
    const next = this.users[1] ?? this.users[0];
    this.users.push(this.users.shift()!);

    return {
      now,
      next,
    };
  }

  getUserString() {
    return this.users.join(":");
  }

  private parseUser(userString?: string): string[] {
    if (!userString) return [];

    const users = userString.split(":");
    const isValid = users.every(
      (user) => user.startsWith("U") && user.length === 11
    );

    if (!isValid)
      throw new CommandError(CommandErrorName.COMMON_USER_DATA_BROKEN);

    return users;
  }
}
