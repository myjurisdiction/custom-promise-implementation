const PROMISE_STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class AwesomePromise {
  constructor(executor) {
    this.state = PROMISE_STATES.PENDING;
    this.value = undefined;
    this.handlers = []; // stores callbacks of then, catch or finnaly

    // Bind these so 'this' remains correct when passed into executor
    this._resolve = this._resolve.bind(this);
    this._reject = this._reject.bind(this);

    try {
      executor(this._resolve, this._reject);
    } catch (e) {
      this._reject(e);
    }
  }

  _resolve(value) {
    this._updatePromiseState(value, PROMISE_STATES.FULFILLED);
  }

  _reject(err) {
    this._updatePromiseState(err, PROMISE_STATES.REJECTED);
  }

  then(onSuccessCallback, onFailCallback) {
    return new AwesomePromise((res, rej) => {
      this._addHandler({
        onSuccess: function (value) {
          if (!onSuccessCallback) {
            return res(value);
          }
          try {
            return res(onSuccessCallback(value));
          } catch (error) {
            return rej(err);
          }
        },
        onFail: function (err) {
          if (!onFailCallback) {
            return rej(err);
          }

          try {
            return res(onFailCallback(err));
          } catch (err) {
            return rej(err);
          }
        },
      });
    });
  }

  catch(onFail) {}

  finally(callback) {}

  _updatePromiseState(value, state) {
    queueMicrotask(() => {
      // Do not re-(resolve/reject) the promise
      if (this.state !== PROMISE_STATES.PENDING) {
        return;
      }
      this.state = state;
      this.value = value;

      if (this._isThenable(value)) {
        return value.then(this._resolve, this._reject);
      }

      this._executeHandler();
    });
  }

  _isThenable(value) {
    if (value instanceof AwesomePromise || typeof value?.then === "function") {
      return true;
    }
    return false;
  }

  _executeHandler() {
    // execute handlers only if the promise state is not in pending state
    if (this.state === PROMISE_STATES.PENDING) {
      return null;
    }

    this.handlers.forEach((handler) => {
      if (this.state === PROMISE_STATES.FULFILLED) {
        return handler.onSuccess(this.value);
      }

      return handler.onFail(this.value);
    });

    // reset the handlers array to empty array
    this.handlers = [];
  }

  _addHandler(handler) {
    this.handlers.push(handler);
  }
}

const delayed = new AwesomePromise((resolve) => {
  setTimeout(() => {
    resolve(100);
  }, 2000);
});

const immediate = new AwesomePromise((resolve) => {
  resolve("I love promises");
});

delayed.then((val) => console.log('Resolved with:', val));
