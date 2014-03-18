
module.exports = function suspend() {
  var done = false;
  var timeoutError = null;
  var timer;
  var args;

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
        } else {
          args = arguments;
          done = true;
        }
      }
    }
  };
};


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
