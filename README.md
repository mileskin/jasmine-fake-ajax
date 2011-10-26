# Fake Ajax to be used with the [Jasmine BDD framework](http://pivotal.github.com/jasmine/) and jQuery Ajax

## Summary

Usage in a nutshell: you provide a context which is a list of fake Ajax options with success data or error message. When the spec is run, fake ajax is called and the data you have supplied will be passed to the real system under test. You may use a combination of multiple fields for matching fake vs. real options.

You may use the real `jQuery.ajax` anytime by calling the global
convenience function `realAjax({url: '/example', ...})`.

See `spec/fake-ajax-spec.js` for executable specification and many examples.

## Examples

### Simplified

    describe('simple example', function() {
      it('just works', function() {
        var message = 'Hello '
        registerFakeAjax({url: '/simple', successData: 'World!'})
        $.get('/simple', function(data) {
          message += data
        })
        expect(message).toEqual('Hello World!')
      })
    })

### REST

Support for RESTfull requests by defining HTTP method (type). Also data, dataType and async are used for matching fake vs. real Ajax options:

    fakeAjax({registrations:[
      {url: '/example', type: 'put'}, // no match
      {url: '/example', type: 'post'} // match!
    ]})
    $.ajax({url: '/example', type: 'post', data: {user: 'dog'}, dataType: 'json'})

    fakeAjax({registrations:[
      {url: '/example', type: 'post', data: {user: 'dog'}}, // match!
      {url: '/example', type: 'post', data: {user: 'cat'}}  // no match
    ]})
    $.ajax({url: '/example', type: 'post', data: {user: 'dog'}})

### Registering fake Ajax

You can register fake ajax options in a list using `fakeAjax({registrations:[options1, options2]})` and/or one by one using `registerFakeAjax(options)`. You can easily mix and match both, e.g. registering some general options in `beforeEach` and then some custom options in `it`.

The context (with all registered fake Ajax options) will be cleared
before each test.

### Using test data

You may inline the test data

    fakeAjax({registrations:[{url: '/succeeds', successData: 'Jasmine FTW!'}]})

or load the test data using `loadTestData`. You can add multiple blocks of fake html and then use any jQuery selector to pick the right one. Here we load the contents of `.questions` from `fake-ajax-fixture.html`:

    fakeAjax({registrations:[{url: '/questions/list', successData: loadTestData('.questions', 'fake-ajax-fixture.html')}]})

and when you need the error handler to be called you can

    fakeAjax({registrations:[{url: '/fails', errorMessage: 'argh'}]})

Fake response data in JSON format (simply a js map):

    fakeAjax({registrations:[{url: '/user', successData: {name: 'John', age: 30}}]})

It should be straight forward to load fake JSON from an external file if you will:

    fake-json.js:
    var FakeJsons = {
      first: {name: 'John', age: 30},
      second: {foo: [{key: 1}, {key: 2}]}
    }
    // Load both files in spec runner html
    my-spec.js:
    registerFakeAjax({
      url: '/example',
      success: {
        data: FakeJsons.second
      }
    })

### Passing data to success/error handlers

There are 4 possible callback rules you can use (only one at a time): `success`, `successData`, `error` and `errorMessage`.

If you only need to define the success data you can use the simple `successData` callback rule:

    registerFakeAjax({url: '/example', successData: 'yay'})

However, if you need to be more specific with the success callback arguments you can use `success` callback rule:

    registerFakeAjax({url: '/example', success: {data: {name: 'John'}, textStatus: 'ok', ...}})

If you only need to define the error message you can use the simple `errorMessage` callback rule:

    registerFakeAjax({url: '/example', errorMessage: 'crap'})

However, if you need to be more specific with the error callback arguments you can use `error` callback rule:

    registerFakeAjax({url: '/example', error: {xhr: {status: 500}, responseText: 'oh noez', ...}})

Again, there are many more examples in `spec/fake-ajax-spec.js`.

### Multiple Ajax calls

Often, multiple Ajax calls are executed under the hood when e.g. clicking a link. `fakeAjax` lets you define which calls will succeed and which will fail:

    fakeAjax({registrations:[
      {url: '/answers/get?questionId=question2', successData: loadTestData('.answer2', 'fake-ajax-fixture.html')},
      {url: '/authors/get?answerId=answer2', errorMessage: 'author data not available'},
      {url: '/onError', successData: 'Please try again later.'}
    ]})

### Inspecting Ajax requests

You are not forced to define any context. Maybe you are only interested in what is sent to the server? Then you can use `latestAjax` or `latestAjaxWithUrlMatching` to get a handle to desired ajax options recorded during the test run:

    expect(latestAjaxWithUrlMatching('first').data).toEqual({'param1': 'value1', 'param2': 'value2'})
    expect(latestAjaxWithUrlMatching('second').url).toContain('foo=bar')
    expect(latestAjax().url).toEqual('/third')

Warnings and errors during the test run are logged into the firebug console, so you should consider keeping it open.

## Installation instructions

Note: _the lib_ hear means `jasmine-fake-ajax-X.js`

In short: put files in `dependencies/` and `lib/jasmine-fake-ajax.js` to your load path. You should be good to go. Probably works with other jQuery versions than in `dependencies/`. However, please report if there are any problems.

Dependencies for _using_ this lib:

* [jQuery](http://jquery.com/), the lib should work with 1.4.x, 1.5.x
  and 1.6.x, please report if you have any problems
* [Jasmine](http://pivotal.github.com/jasmine/)
* the great [underscore.js](http://documentcloud.github.com/underscore/)
  is used for embracing functional programming style in the lib

Dependencies for _developing_ this lib and running the tests:

* [jasmine-jquery](https://github.com/velesin/jasmine-jquery) for some
  tests that use DOM
* [PhantomJS](http://www.phantomjs.org/) for running tests headless from
  command line
* [Watchr](http://mynyml.com/ruby/flexible-continuous-testing) for
  running all tests on any change to source files (using PhantomJS)
* currently only one piece of js is written in
  [CoffeeScript](http://jashkenas.github.com/coffee-script/) but I'm
planning to use it more

## Running the tests

Tested with multiple versions of Firefox and Chrome. Both have very good
development/debugging tools. Chrome seems to be a lot faster. Firefox
should be ok out-of-the-box but if you want to use Chrome you must allow
it to load local files:

    open -a 'Google Chrome' --args --allow-file-access-from-files

## TODO

* extract executable examples from executable spec
* rewrite with [CoffeeScript](http://jashkenas.github.com/coffee-script/)!

---

Hope you enjoy, don't forget to [follow me on twitter](http://twitter.com/mileskin)!

