# co-suspend

Suspend execution until it is resumed asynchronously.

## Installation

```
$ npm install co-suspend
```

## Example

Pause program execution until resume, using `yield`.

```js
var request = require('request');
var suspend = require('co-suspend');

module.exports.fetchContent = function * (url) {
  var marker = suspend();
  var contentBody;

  request('http://www.google.com', function (err, res, body) {
    if (err) {
      throw err;
    }

    contentBody = body;

    marker.resume();
  })

  yield marker.wait();

  return contentBody;
};
```

**Note:** If a first argument is passed to `marker.resume()`, it **must** be an Error.

## License

MIT
