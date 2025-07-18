const PROMISE_STATES = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
};

class AwesomePromise {
  constructor(executor) {
    this.state = PROMISE_STATES.PENDING;
    this.value = undefined;
    this.handlers = []; // satores callbacks of then, catch or finnaly

    try {
      executor(this._resolve, this._reject);
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve() {}

  _reject() {}

  then(onSuccess, onFail) {}

  catch(onFail) {}

  finally(callback) {}
}
