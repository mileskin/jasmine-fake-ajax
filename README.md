# Fake Ajax to be used with the [Jasmine BDD framework](http://pivotal.github.com/jasmine/) and jQuery Ajax

Usage in a nutshell: you provide a context which is a list of fake Ajax options with success data or error message. When the spec is run, fake ajax is called and the data you have supplied will be passed to the real system under test. You may use a combination of multiple fields for matching fake vs. real options.

See `spec/fake-ajax-spec.js` for executable specification and many examples.

Simplified:

    describe('simple example', function() {
      it('just works', function() {
        fakeAjax({mappings:[
          {url: '/simple', successData: 'world!'}
        ]})
        var message = 'hello '
        $.get('/simple', function(data) {
          message += data
        })
        expect(message).toEqual('hello world!')
      })
    })

Support for RESTfull requests by defining HTTP method (type). Also data, dataType and async are used for matching fake vs. real Ajax options:

    fakeAjax({mappings:[
      {url: '/example', type: 'put'}, // no match
      {url: '/example', type: 'post'} // match!
    ]})
    $.ajax({url: '/example', type: 'post', data: {user: 'dog'}, dataType: 'json'})

    fakeAjax({mappings:[
      {url: '/example', type: 'post', data: {user: 'dog'}}, // match!
      {url: '/example', type: 'post', data: {user: 'cat'}}  // no match
    ]})
    $.ajax({url: '/example', type: 'post', data: {user: 'dog'}})

You may inline the test data

    fakeAjax({mappings:[{url: '/succeeds', successData: 'Jasmine FTW!'}]})

or load the test data using `loadTestData`. Here we load the contents of `.questions` from `fake-ajax-fixture.html`:

    fakeAjax({mappings:[{url: '/questions/list', successData: loadTestData('.questions', 'fake-ajax-fixture.html')}]})

and when you need the error handler to be called you can

    fakeAjax({mappings:[{url: '/fails', errorMessage: 'argh'}]})

Fake response data in JSON format (simply a js map):

    fakeAjax({mappings:[{url: '/user', successData: {name: 'John', age: 30}}]})

Often, multiple Ajax calls are executed under the hood when e.g. clicking a link. `fakeAjax` lets you define which calls will succeed and which will fail:

    fakeAjax({mappings:[
      {url: '/answers/get?questionId=question2', successData: loadTestData('.answer2', 'fake-ajax-fixture.html')},
      {url: '/authors/get?answerId=answer2', errorMessage: 'author data not available'},
      {url: '/onError', successData: 'Please try again later.'}
    ]})

You are not forced to define any context. Maybe you are only interested in what is sent to the server? Then you can use `latestAjax` or `latestAjaxWithUrlMatching` to get a handle to desired ajax options recorded during the test run:

    expect(latestAjaxWithUrlMatching('first').data).toEqual({'param1': 'value1', 'param2': 'value2'})
    expect(latestAjaxWithUrlMatching('second').url).toContain('foo=bar')
    expect(latestAjax().url).toEqual('/third')

Warnings and errors during the test run are logged into the firebug console, so you should consider keeping it open.

## Installation instructions

Put files in `dependencies/` and `lib/jasmine-fake-ajax.js` to your load path. You should be good to go. Probably works with other jQuery versions than in `dependencies/`. However, please report if there are problems.

## TODO

* run all tests after every change to sources, headless? maybe using [something
  like this](http://blog.bitmechanic.com/continuous-integration-for-qunit-tests)?
* implement jasmine.FakeAjax.register({url: '/a'}) and use in init
  (maybe global .addFakeAjaxOptions?)
* introduce proper xhr, not just message
* rewrite with coffeescript

---

Hope you enjoy, don't forget to [follow me on twitter](http://twitter.com/mileskin)!

