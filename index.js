/**
Suspend
*/

/**
Expose function
*/
module.exports = function suspend() {
  return createMarker();
};


/**
Wrap inside a builder method to encapsulate the marker
*/
function createMarker() {
  var done = false;
  var timeoutError = null;
  var timer;
  var args;

  function reset() {
    done = false;
    timeoutError = null;
    timer = undefined;
    args = undefined;
  }

  return {
    wait: function wait(timeout) {
      if (timeout) {
        timer = setTimeout(function () {
          timer = false;
          timeoutError = new AsyncTimeoutError('Asynchronous timeout : ' + timeout + ' ms');

          if (done instanceof Function) {
            done(timeoutError);
          }
        }, timeout);
      }

      return function wait(cb) {
        if (done) {
          cb.apply(null, args);
          reset();
        } else {
          if (timeoutError) {
            cb(timeoutError);
          } else {
            done = cb;
          }
        }
      };
    },
    resume: function resume() {
      if (!timeoutError) {
        if (timer) {
          clearTimeout(timer);
        }

        if (done instanceof Function) {
          done.apply(null, arguments);
          reset();
        } else {
          args = arguments;
          done = true;
        }
      }
    }
  };
}


/**
Custom async error
*/
var AsyncTimeoutError = module.exports.AsyncTimeoutError = function AsyncTimeoutError(msg) {
  msg && (this.message = msg);
  Error.apply(this, arguments);
  Error.captureStackTrace(this, AsyncTimeoutError);
};
require('util').inherits(AsyncTimeoutError, Error);
AsyncTimeoutError.prototype.name = AsyncTimeoutError.name;
