/**
Suspend
*/

var errorFactory = require('error-factory');

var SuspendError = errorFactory('SuspendError');
var AsyncTimeoutError = errorFactory('AsyncTimeoutError');

var globalIndex = 0;


/**
Expose function
*/
module.exports = createMarker;
module.exports.SuspendError = SuspendError;
module.exports.AsyncTimeoutError = AsyncTimeoutError;


/**
Wrap inside a builder method to encapsulate the marker
*/
function createMarker() {
  var markerId = ++globalIndex;
  var active = false;
  var done = false;
  var timeoutError = null;
  var timer;
  var args;

  function reset() {
    var _saved = {
      active: active,
      done: done,
      timeoutError: timeoutError,
      timer: timer,
      args: args
    };

    active = false;
    done = false;
    timeoutError = null;
    timer = undefined;
    args = undefined;

    return _saved;
  }

  function wait(timeout) {
    if (active) {
      throw new SuspendError('Marker already in use');
    }
    active = true;

    if (timeout) {
      timer = setTimeout(function () {
        var saved;

        timeoutError = new AsyncTimeoutError('Asynchronous timeout : ' + timeout + ' ms');

        if (done instanceof Function) {
          saved = reset();
          saved.done(saved.timeoutError);
        }
      }, timeout);
    }

    return function wait(cb) {
      var saved;

      if (done) {
        saved = reset();
        cb.apply(null, saved.args);
      } else {
        if (timeoutError) {
          saved = reset();
          cb(saved.timeoutError);
        } else {
          done = cb;
        }
      }
    };
  }

  function resume() {
    var saved;

    if (!timeoutError) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (done instanceof Function) {
        saved = reset()

        saved.done.apply(this, arguments);
      } else {
        args = arguments;
        done = true;
      }
    }
  }

  return Object.create(null, {
    _id: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: markerId
    },
    wait: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: wait
    },
    resume: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: resume
    },
    isWaiting: {
      enumerable: true,
      configurable: false,
      get: function isWaiting() {
        return active
      }
    }
  });
}
