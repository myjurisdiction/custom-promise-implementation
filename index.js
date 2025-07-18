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
            return rej(error);
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

  catch(onFail) {
    return this.then(null, onFail);
  }

  //   Finaly,
  //Registers a callback that runs regardless of whether the promise is fulfilled or rejected.
  //Does not modify the resolved/rejected value unless the callback() itself throws an error.
  // Returns a new promise that resolves/rejects with the same value/error as the original promise after the callback has run.
  finally(callback) {
    return new AwesomePromise((res, rej) => {
      let wasRejected, value;
      this.then(
        (val) => {
          wasRejected = false;
          value = val;
          try {
            return callback();
          } catch (err) {
            return rej(err);
          }
        },
        (err) => {
          wasRejected = true;
          value = err;

          try {
            return callback();
          } catch (err) {
            return rej(err);
          }
        }
      ).then(() => {
        // this is called after the callback() finishes (successfully)
        if (wasRejected) {
          return rej(value);
        }
        return res(value);
      });
    });
  }

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

/************************** TEST CASES ************************************/

// const delayed = new AwesomePromise((resolve) => {
//   setTimeout(() => {
//     resolve(100);
//   }, 2000);
// });

// const immediate = new AwesomePromise((resolve) => {
//   resolve("I love promises");
// });

// const immediateErr = new AwesomePromise((_, rej) => {
//   rej("I failed immediately");
// });

// const delayedErr = new AwesomePromise((_, rej) => {
//   setTimeout(() => {
//     rej("I failed after 2 seconds !!");
//   }, 2000);
// });

// delayedErr.catch((val) => console.log("RESULT:", val));

// delayed
//   .finally(() => console.log("Cleanup"))
//   .then((val) => console.log("Resolved:", val))
//   .catch((err) => console.log("Rejected:", err));

// const testPromiseWithLateResolve = new AwesomePromise((res, rej) => {
//   setTimeout(() => {
//     res("Promise 1 is resolved");
//   }, 1000);
// });

// testPromiseWithLateResolve.then((val) => {
//   console.log(val);
// });

// const testPromiseWithLateReject = new AwesomePromise((res, rej) => {
//   setTimeout(() => {
//     rej("Promise 2 is rejected");
//   }, 1000);
// });

// testPromiseWithLateReject
//   .then((val) => {
//     console.log(val);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// const testPromiseWithRejectFinally = new AwesomePromise((res, rej) => {
//   setTimeout(() => {
//     rej("Promise 2 is rejected");
//   }, 1000);
// });

// testPromiseWithRejectFinally
//   .finally(() => {
//     console.log("finally called");
//   })
//   .catch((err) => {
//     console.log("value rejected after finally", err);
//   });

// const testPromiseWithEarlyResolve = new AwesomePromise((res, rej) => {
//   res("Promise 3 is resolved early");
// });

// setTimeout(() => {
//   testPromiseWithEarlyResolve.then((val) => {
//     console.log(val);
//   });
// }, 3000);

// const p = new AwesomePromise((resolve) => {
//   setTimeout(() => {
//     resolve(100);
//   }, 1000);
// });

// p.then((val) => {
//   console.log("Resolved:", val);
// })
//   .catch((err) => {
//     console.log("Caught:", err);
//   })
//   .finally(() => {
//     console.log("Cleanup done");
//   });

new AwesomePromise((res) => res(1))
  .then((val) => val + 1)
  .then((val) => console.log("chained val:", val)); // should log 2

new AwesomePromise((res) => res(10))
  .then(() => {
    throw new Error("Oops");
  })
  .catch((err) => console.log("caught error:", err.message));
