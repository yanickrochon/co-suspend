
var co = require('co');
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
    var expectedSequence = '01234567';
    var sequence = '';
    var seqIndex = 0;
    var marker = suspend();

    var fn = function * (t, m) {
      setTimeout(function () {
        sequence += (seqIndex++);
        marker.resume(null, m);
      }, t);

      sequence += (seqIndex++);
      return yield marker.wait();
    };

    (yield fn(10, 'msg1')).should.be.equal('msg1');
    (yield fn(20, 'msg2')).should.be.equal('msg2');
    (yield fn(10, 'msg3')).should.be.equal('msg3');
    (yield fn(30, 'msg4')).should.be.equal('msg4');

    sequence.should.equal(expectedSequence);
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

  it('should timeout on wait', function (done) {
    var marker = suspend();
    var markerWait;

    this.timeout(100);

    markerWait = marker.wait(10);

    setTimeout(function () {
      markerWait(function (err) {
        err.should.be.an.Error;

        done();
      });
    }, 20);

  });

  it('should not allow concurrent use', function * () {
    var marker = suspend();

    this.timeout(200);

    setTimeout(function () {
      co(function * () {
        yield marker.wait();
      })(function (err) {
        err.should.be.an.Error;
        err.message.should.equal('Marker already in use');

        marker.resume();  // all good!
      });
    }, 50);

    return yield marker.wait(100);
  });

  it('should allow calling resume multiple times', function * () {
    var marker = suspend();
    var fn = function * (t) {
      setTimeout(function () {
        marker.resume();
      }, t);

      return yield marker.wait();
    };

    this.timeout(50);

    yield fn(20);

    marker.resume();
    marker.resume();
    marker.resume();
  });

  it('should return valid active state', function * () {
    var marker = suspend();

    marker.isWaiting.should.be.false;
    marker.resume();
    marker.isWaiting.should.be.false;
    yield marker.wait(); // will not wait...
    marker.isWaiting.should.be.false;

    setTimeout(function () {
      marker.isWaiting.should.be.true;
      marker.resume();
      marker.isWaiting.should.be.false;
    }, 20);
    yield marker.wait();
  });


  it('should enqueue more yieldables', function (done) {
    var marker = suspend();
    var steps = [];
    var rs;

    co(function * () {
      var waitForResume = true;

      setTimeout(function () {
        steps.push(1);

        marker.resume(null, "Hello world!");

        steps.push(2);

        waitForResume = false;  // should exit while below...
      }, 100);

      // return only resolve only AFTER marker.resume() is called
      marker.enqueue(function * () {
        steps.push(0);
        while (waitForResume) {  // wait for setTimeut above...
          yield function * () {};
        }
        steps.push(3);
      });

      marker.enqueue(function (done) {
        setTimeout(function () {

          waitForResume.should.be.false;

          steps.push(4);

          done();
        }, 300);
      });

      rs = yield marker.wait(1000);

      steps.push(5);

      return rs;
    })(function (err, rs) {
      assert.equal(err, undefined);

      steps.should.eql([0, 1, 2, 3, 4, 5]);
      rs.should.equal('Hello world!');

      done();
    });

  });

});
