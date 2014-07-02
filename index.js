/**
Suspend
*/

var co = require('co');

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
  var waiting = false;
  var done = false;
  var doneArgs = undefined;
  var timeoutError = null;
  var queueCount = 0;
  var timer;

  function reset() {
    var _saved = {
      //waiting: waiting,
      done: done,
      doneArgs: doneArgs,
      timeoutError: timeoutError//,
      //timer: timer
    };

    waiting = false;
    done = false;
    doneArgs = undefined;
    timeoutError = null;
    timer = undefined;

    return _saved;
  }

  function wait(timeout) {
    if (waiting) {
      throw SuspendError('Marker already in use');
    }
    waiting = true;

    if (timeout) {
      timer = setTimeout(function () {
        var saved;

        timeoutError = AsyncTimeoutError('Asynchronous timeout : ' + timeout + ' ms');

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
        cb.apply(null, saved.doneArgs || []);
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

    if (queueCount) {
      if (arguments.length) {
        doneArgs = arguments;
      }
      return;   // still waiting for queue to complete...
    }

    if (!timeoutError) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (done instanceof Function) {
        saved = reset()

        saved.done.apply(this, saved.doneArgs || arguments);
      } else {
        !doneArgs && arguments.length && (doneArgs = arguments);
        done = true;
      }
    }
  }

  function enqueue(fn) {
    ++queueCount;

    co(function * () { yield fn; })(function () {
      --queueCount;

      if (waiting) {
        resume();  // try to resume
      }
    });
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
    enqueue: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: enqueue
    },
    isWaiting: {
      enumerable: true,
      configurable: false,
      get: function isWaiting() {
        return waiting
      }
    }
  });
}
