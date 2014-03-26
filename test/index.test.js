
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

  it('should be reusable', function * () {
    var marker = suspend();

    var fn = function * (t, m) {
      var marker = suspend();

      setTimeout(function () {
        marker.resume(null, m);
      }, t);

      return yield marker.wait();
    };

    (yield fn(10, 'msg1')).should.be.equal('msg1');
    (yield fn(20, 'msg2')).should.be.equal('msg2');
    (yield fn(10, 'msg3')).should.be.equal('msg3');
    (yield fn(30, 'msg4')).should.be.equal('msg4');

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
