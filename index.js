
module.exports = function suspend() {
  var done = false;

  return {
    wait: function wait() {
      return function wait(cb) {
        if (done) {
          cb();
        } else {
          done = cb;
        }
      };
    },
    resume: function resume(data) {
      if (done instanceof Function) {
        done(data);
      } else {
        done = true;
      }
    }
  };
};
