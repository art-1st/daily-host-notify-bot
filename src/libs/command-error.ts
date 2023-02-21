export enum CommandErrorName {
  COMMON_CHANNEL_NOT_EXIST = "COMMON_CHANNEL_NOT_EXIST",
  COMMON_CHANNEL_NO_USERS = "COMMON_CHANNEL_NO_USERS",
  COMMON_USER_NOT_IN_THIS_CHANNEL = "COMMON_USER_NOT_IN_THIS_CHANNEL",
  COMMON_SLACK_USER_NOT_FOUND = "COMMON_SLACK_USER_NOT_FOUND",
  COMMON_NOT_FOUND_USER = "COMMON_NOT_FOUND_USER",
  COMMON_USER_DATA_BROKEN = "COMMON_USER_DATA_BROKEN",
  SET_USER_ALREADY_EXISTS = "SET_USER_ALREADY_EXISTS",
  SET_USER_NOT_EXISTS = "SET_USER_NOT_EXISTS",
}

export default class CommandError extends Error {
  constructor(name: CommandErrorName, message?: string) {
    super();
    this.name = name;
    this.message = message || this.getErrorMessage();
  }

  getErrorMessage() {
    switch (this.name) {
      case CommandErrorName.COMMON_CHANNEL_NOT_EXIST:
        return "이 채널은 등록되지 않은 채널입니다. 채널을 추가해주세요,";
      case CommandErrorName.COMMON_CHANNEL_NO_USERS:
        return "이 채널에 사용자가 없습니다. 사용자를 등록 후 진행해주세요.";
      case CommandErrorName.COMMON_USER_NOT_IN_THIS_CHANNEL:
        return "이 채널에 해당 사용자가 없습니다.";
      case CommandErrorName.COMMON_SLACK_USER_NOT_FOUND:
        return "Slack 사용자를 찾을 수 없습니다.";
      case CommandErrorName.COMMON_NOT_FOUND_USER:
        return "사용자를 찾을 수 없습니다.";
      case CommandErrorName.COMMON_USER_DATA_BROKEN:
        return "채널 사용자 정보 오류";
      case CommandErrorName.SET_USER_ALREADY_EXISTS:
        return "채널에 이미 등록된 사용자입니다.";
      case CommandErrorName.SET_USER_NOT_EXISTS:
        return "채널에 등록되지 않은 사용자입니다.";
      default:
        return "";
    }
  }
}
