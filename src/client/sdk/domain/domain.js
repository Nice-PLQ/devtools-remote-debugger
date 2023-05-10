export default class BaseDomain {
  constructor(options) {
    this.socket = options.socket;
  }

  enable() {}

  send(data) {
    this.socket.send(JSON.stringify(data));
  }
}
