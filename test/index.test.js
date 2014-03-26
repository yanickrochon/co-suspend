
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

    this.timeout(200);

    yield fn(100);
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

    this.timeout(200);

    try {
      yield fn(100);
    } catch (e) {
      err = e;
    }

    err.should.be.an.Error;
  });

  it('should return waited value', function * () {

    var fn = function * (t) {
      var marker = suspend();

      setTimeout(function () {
        marker.resume(null, 'foo');
      }, t);

      return yield marker.wait();
    };

    this.timeout(200);

    (yield fn(100)).should.equal('foo');


    var fn2 = function * (t) {
      var marker = suspend();

      marker.resume(null, 'bar');

      return yield marker.wait();
    };

    (yield fn2(100)).should.equal('bar');

  });

  it('should timeout', function * () {
    var error;

    var fn = function * (t) {
      var marker = suspend();

      setTimeout(function () {
        marker.resume(null, 'foo');
      }, t);

      return yield marker.wait(50);
    };

    this.timeout(200);

    (yield fn(20)).should.equal('foo');

    try {
      (yield fn(100)).should.equal('foo');
    } catch (e) {
      error = e;
    }

    error.should.be.an.Error;
    error.should.be.instanceof(suspend.AsyncTimeoutError);
    error.message.should.equal('Asynchronous timeout : 50 ms');

  });

});
