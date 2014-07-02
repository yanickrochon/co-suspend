# co-suspend

Suspend execution until it is resumed asynchronously.

## Installation

```
$ npm install co-suspend
```

## Example 1

Pause program execution until resume, using `yield`.

```javascript
var request = require('request');
var suspend = require('co-suspend');

module.exports.fetchContent = function * (url) {
  var marker = suspend();

  request('http://www.google.com', function (err, res, body) {
    marker.resume(err, body);
  });

  return yield marker.wait();  // return body
};
```

**Note:** If a non-null first argument is passed to `marker.resume()`, it **must** be an Error.
Any other argument will be ignored.


## Example 2

Use `co-suspend` instead of `thunkify`.

```javascript
var fs = require('fs');
var suspend = require('co-suspend');

function * getFiles(path) {
  var marker = suspend();
  fs.readdir(path, marker.resume);

  return yield marker.wait();
}
```

## Example 3

Wait a certain amount of time (milliseconds) before timing out.

```javascript
var db = require('./some-db-module');
var suspend = require('co-suspend');

function * connect(conStr) {
  var marker = suspend();

  db.connect(conStr, marker.resume);

  return yield marker.wait(3000);  // wait 3 seconds
}
```

The above code will wait at most 3 seconds, after which an error will be thrown if
`marker.resume()` has not been called.

```javascript
var connect;

try {
  connect = yield connect(dbConnectionString);
} catch (e) {
  console.error('Connection timeout!');
}
```

## Example 4

Markers are reusable, too!

```javascript
var marker = suspend();
var result;

someAsyncFunctionWithCallback(marker.resume);
result = yield marker.wait();
//....

otherAsyncFunctionWithCallback(marker.resume);
result = yield marker.wait();
//...

finalAsyncWithCallback(marker.resume);
result = yield marker.wait();
//...
```

## Example 5

Using an experimental feature to enqueue some yieldable in the waiting marker.

```javascript
var marker = suspend();
var result;

var q = db.query(selectQuery, marker.resume);
q.on('row', function (row) {
  marker.enqueue(function * () {
    // process row asynchronously... the marker will wait for this to return!
  });

  marker.enqueue(function (done) {
    // this works, too! In fact, anything co compatible will work just fine
    // as argument to .enqueue()

    setTimeout(done, 3000);
  });
});

result = yield marker.wait(QUERY_TIMEOUT);
```

**Note**: calling `marker.enqueue()` to an un-waiting marker will simply execute
the yieldable (function, generator, thunk, etc.) inside an anonymous `co` context.

**Note**: because `marker.enqueue()` is meant to be used inside a synchronous
context, the function does not return anything. In fact, there is really no reason
why it should return anything.


## License

MIT
