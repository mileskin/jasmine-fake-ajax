# Fake Ajax to be used with the [Jasmine BDD framework](http://pivotal.github.com/jasmine/)

Usage in a nutshell: you provide a context which is a list of mappings from an URL to succes data or error message. When the spec is run, fake ajax is called and the data you have supplied will be passed to the real system under test.

See `spec/fake-ajax-spec.js` for live specification.

Simplified:

    describe('simple example', function() {
      it('just works', function() {
        fakeAjax({urls: {'/simple': {successData: 'y'}}})
        var result = 'x'
        $.get('/simple', function(data) {
          result = data
        })
        expect(result).toEqual('y')
      })
    })

You may inline the test data

    fakeAjax({urls: {'/succeeds': {successData: 'Jasmine FTW!'}}})

or load the test data using `loadTestData`. Here we load the contents of `.questions` from `fake-ajax-fixture.html`:

    fakeAjax({urls: {'/questions/list': {successData: loadTestData('.questions', 'fake-ajax-fixture.html')}}})

and when you need the error handler to be called you can

    fakeAjax({urls: {'/fails': {errorMessage: 'argh'}}})

Fake response data in JSON format (simply a js map):

    fakeAjax({urls: {'/user': {successData: {name: 'John', age: 30}}}})

Often, multiple Ajax calls are executed under the hood when e.g. clicking a link. `fakeAjax` lets you define which calls will succeed and which will fail:

    fakeAjax({
      urls: {
        '/answers/get?questionId=question2': {successData: loadTestData('.answer2', 'fake-ajax-fixture.html')},
        '/authors/get?answerId=answer2': {errorMessage: 'author data not available'},
        '/onError': {successData: 'Please try again later.'}
      }
    })

You are not forced to define any context. Maybe you are only interested in what is sent to the server? Then you can use `latestAjax` or `latestAjaxWithUrlMatching` to get a handle to desired ajax options recorded during the test run:

    expect(latestAjaxWithUrlMatching('first').data).toEqual({'param1': 'value1', 'param2': 'value2'})
    expect(latestAjaxWithUrlMatching('second').url).toContain('foo=bar')
    expect(latestAjax().url).toEqual('/third')

Warnings and errors during the test run are logged into the firebug console, so you should consider keeping it open.

## Installation instructions

Put files in `dependencies/` and `lib/jasmine-fake-ajax.js` to your load path. You should be good to go. Probably works with other jQuery versions than in `dependencies/`. However, please report if there are problems.

Hope you enjoy!
