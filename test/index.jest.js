
var suspend = require('..');

describe('Co Suspend', function () {

  it('should suspend and resume', function * () {

    var fn = function * (t) {
      var marker = suspend();

      setTimeout(function () {
        marker.resume();
      }, t);

      return yield marker.wait();
    };

    this.timeout(600);

    yield fn(500);
  });


  it('should throw', function * () {
    var err;

    var fn = function * (t) {
      var marker = suspend();

      setTimeout(function () {
        marker.resume(new Error('foo'));
      }, t);

      return yield marker.wait();
    };

    this.timeout(600);

    try {
      yield fn(500);
    } catch (e) {
      err = e;
    }

    err.should.be.an.Error;
  });

});
