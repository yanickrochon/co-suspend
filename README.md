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


## License

MIT
