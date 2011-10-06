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

describe('rules for resolving which fake ajax options match the real options', function() {
  it('default type is get', function() {
    registerFakeAjax({url: '/a', successData: 1})
    $.get('/a', successHandler)
    expect(result.success.data).toEqual(1)
  })

  it('raises error when multiple matching fake options are found', function() {
    fakeAjax({registrations:[
      {url: '/x'},
      {url: '/x', type: 'get'},
    ]})
    expect(function(){ $.get('/x') }).toThrow('Multiple matching fake ajax options found, not able to decide which callbacks to use because the result was ambiguous. Real ajax options: {"type":"get","url":"/x"}. All matching (and thus conflicting) fake options: {"url":"/x"},{"url":"/x","type":"get"}')
  })

  it('selects fake options with all given fields matching equivalent fields in real options', function() {
    fakeAjax({registrations:[
      {url: '/a', data: {user: 'cat'}, successData: 1},
      {url: '/a', data: {user: 'dog'}, successData: 2},
      {url: '/a', type: 'post', successData: 3},
      {url: '/b', type: 'put', data: {user: 'bob', age: 30}, async: false, dataType: 'json', successData: 4},
      {url: '/b', type: 'put', data: {user: 'bob', age: 30}, async: false, dataType: 'xml', successData: 5},
      {url: '/c', successData: 6}
    ]})

    $.ajax({url: '/a', type: 'get', data: {user: 'dog'}, success: successHandler})
    expect(result.success.data).toEqual(2)

    $.post('/a', successHandler)
    expect(result.success.data).toEqual(3)

    $.ajax({url: '/b', type: 'put', dataType: 'json', async: false, data: {user: 'bob', age: 30}, success: successHandler})
    expect(result.success.data).toEqual(4)

    $.ajax({url: '/c', data: {age: 99}, async: true, success: successHandler})
    expect(result.success.data).toEqual(6)
  })

  it('compares url', function() {
    fakeAjax({registrations:[
      {url: '/a', successData: 1},
      {url: '/b', successData: 2}
    ]})
    $.get('/b', successHandler)
    expect(result.success.data).toEqual(2)
  })

  it('compares type', function() {
    fakeAjax({registrations:[
      {type: 'put', successData: 1},
      {type: 'delete', successData: 2}
    ]})
    $.ajax({type: 'delete', success: successHandler})
    expect(result.success.data).toEqual(2)
  })

  it('compares data', function() {
    fakeAjax({registrations:[
      {data: {user: 'dog'}, successData: 1},
      {data: {user: 'cat'}, successData: 2}
    ]})
    $.ajax({data: {user: 'cat'}, success: successHandler})
    expect(result.success.data).toEqual(2)
  })

  it('compares dataType', function() {
    fakeAjax({registrations:[
      {dataType: 'json', successData: 1},
      {dataType: 'xml', successData: 2}
    ]})
    $.ajax({dataType: 'json', success: successHandler})
    expect(result.success.data).toEqual(1)
  })

  it('compares async', function() {
    fakeAjax({registrations:[
      {async: true, successData: 1},
      {async: false, successData: 2}
    ]})
    $.ajax({async: true, success: successHandler})
    expect(result.success.data).toEqual(1)
  })
})

describe('registering fake ajax options', function() {
  beforeEach(function() {
    registerFakeAjax({url: 'e', successData: 5})
  })

  it('allows adding options groupped and/or one by one', function() {
    registerFakeAjax({url: 'd', successData: 4})
    fakeAjax({registrations:[
      {url: 'b', successData: 2},
      {url: 'c', successData: 3}
    ]})
    registerFakeAjax({url: 'a', successData: 1})

    function assertResult(url, expectedResult) {
      $.ajax({url: url, success: successHandler})
      expect(result.success.data).toEqual(expectedResult)
    }
    _.each([['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]], function(entry) {
      assertResult(entry[0], entry[1])
    })
  })
})

describe('loading test data', function() {
  describe('json', function() {
    it('json object from external file', function() {
      registerFakeAjax({url: 'a', successData: TestResponses.jsonObject})
      $.getJSON('a',successHandler)
      expect(result.success.data.name).toEqual('John')
      expect(result.success.data.age).toEqual(30)
      expect(result.success.data.children).toEqual([{name: 'Mary', age: 2}, {name: 'Jill', age: 4}])
    })

    it('json string from external file', function() {
      registerFakeAjax({url: 'b', successData: $.parseJSON(TestResponses.jsonString)})
      $.getJSON('b',successHandler)
      expect(result.success.data.name).toEqual('Tim')
      expect(result.success.data.age).toEqual('10')
      expect(result.success.data.toys).toEqual(['car1', 'car2'])
    })
  })
})

// Fake AJAX with DOM, single AJAX call. Response test data is loaded using .loadTestData.

describe('showing questions', function() {
  beforeEach(function() {
    setFixtures('<button class="showQuestions"/><div class="questions"></div>')
    sut.setupQuestionsBehavior()
  })

  describe('succeeds', function() {
    beforeEach(function() {
      fakeAjax({registrations:[{url: '/questions/list', successData: loadTestData('.questions', 'fake-ajax-fixture.html')}]})
      $('.showQuestions').click()
    })

    it('shows the list of questions fetched from server', function() {
      expect($('.question').length).toEqual(3)
      expect($('.question').last()).toHaveText('Question 3')
    })
  })

  describe('fails', function() {
    beforeEach(function() {
      fakeAjax({registrations:[{url: '/questions/list', errorMessage: 'Failed loading questions.'}]})
      $('.showQuestions').click()
    })

    it('shows error message from server', function() {
      expect($('.questions')).toHaveText('Failed loading questions.')
    })
  })
})

// Fake AJAX without DOM.

describe('.countResponseLength', function() {
  describe('succeeds', function() {
    beforeEach(function() {
      fakeAjax({registrations:[{url: '/succeeds', successData: 'Jasmine FTW!'}]})
    })

    it('counts response length', function() {
      expect(sut.countResponseLength({url: '/succeeds'})).toEqual(12)
    })
  })

  describe('fails', function() {
    beforeEach(function() {
      fakeAjax({registrations:[{url: '/fails', errorMessage: 'argh'}]})
    })

    it('yields given default value', function() {
      expect(sut.countResponseLength({url: '/fails', defaultOnError: 666})).toEqual(666)
    })

    it('executes given error handler', function() {
      var errorMessage
      function errorHandler(xhr) {
        errorMessage = xhr.responseText
      }
      sut.countResponseLength({url: '/fails', errorHandler: errorHandler})
      expect(errorMessage).toEqual('argh')
    })
  })
})

// Multiple related AJAX calls, some succeed, some fail.

describe('clicking question', function() {
  describe('author is not available', function() {
    beforeEach(function() {
      setFixtures('<ul class="questions"><li id="question1">q1</li><li id="question2">q2</li></ul><div class="answerContainer"></div>')
      sut.setupAnswersBehavior()
      fakeAjax({registrations:[
        {url: '/answers/get?questionId=question2', successData: loadTestData('.answer2', 'fake-ajax-fixture.html')},
        {url: '/authors/get?answerId=answer2', errorMessage: 'author data not available'},
        {url: '/onError', successData: 'Please try again later.'}
      ]})
      $('.questions li').last().click()
    })

    it('shows answer', function() {
      expect($('.answer')).toHaveText('Answer 2')
    })

    it('shows error message instead of author details', function() {
      expect($('.author')).toHaveText('Please try again later.')
    })
  })
})

describe('when checking what is sent to the server', function() {
  beforeEach(function() {
    sut.setupMultipleAjaxCalls()
  })

  it('sends expected data', function() {
    expect(latestAjaxWithUrlMatching('first').data).toEqual({'param1': 'value1', 'param2': 'value2'})
    expect(latestAjax().url).toEqual('/third')
  })

  it('decodes url to enhance readability of values', function() {
    expect(latestAjaxWithUrlMatching('second').url).toContain('+<foo>+"bar+&?#')
  })
})

// When response is expected to be in JSON format ($.getJSON is called in SUT).

describe('showing user info', function() {
  beforeEach(function() {
    setFixtures('<button class="showUser"/><div class="user"><div class="name"></div><div class="age"></div></div>')
    sut.setupUserBehavior()
    fakeAjax({registrations:[{url: '/user', successData: {name: 'John', age: 30}}]})
    $('.showUser').click()
  })

  it('shows name', function() {
    expect($('.user .name')).toHaveText('John')
  })

  it('shows age', function() {
    expect($('.user .age')).toHaveText('30')
  })
})

describe('after each spec', function() {
  it('context is cleared', function() {
    expect(jasmine.FakeAjax.urls).toBeFalsy()
  })
})

describe('supported callbacks', function() {
  var beforeSendWasCalled = false
  var successWasCalled = false
  var completeWasCalled = false

  beforeEach(function() {
    fakeAjax({registrations:[{url: '/example', successData: 'yay'}]})
    $.ajax({
      url: '/example',
      beforeSend: function() {
        beforeSendWasCalled = true
      },
      success: function() {
        successWasCalled = true
      },
      complete: function() {
        completeWasCalled = true
      }
    })
  })

  it('.beforeSend', function() {
    expect(beforeSendWasCalled).toBeTruthy()
  })

  it('.success', function() {
    expect(successWasCalled).toBeTruthy()
  })

  it('.complete', function() {
    expect(completeWasCalled).toBeTruthy()
  })

  describe('success', function() {
    it('passes given data, textStatus and xhr to sut', function() {
      registerFakeAjax({
        url: 'a',
        success: {
          data: {name: 'Bob'},
          textStatus: 'ok',
          xhr: {
            status: 200,
            responseText: 'yay'
          }
        }
      })
      $.ajax({
        url: 'a',
        success: function(data, textStatus, xhr) {
          result.data = data
          result.textStatus = textStatus
          result.xhr = xhr
        }
      })
      expect(result.data.name).toEqual('Bob')
      expect(result.textStatus).toEqual('ok')
      expect(result.xhr.status).toEqual(200)
      expect(result.xhr.responseText).toEqual('yay')
    })

    it('allows using successData convenience property for cases it is enough', function() {
      registerFakeAjax({
        url: 'a',
        successData: 'it worked'
      })
      $.ajax({
        url: 'a',
        success: function(data) {
          result.data = data
        }
      })
      expect(result.data).toEqual('it worked')
    })
  })

  describe('error', function() {
    it('passes given xhr, textStatus and errorThrown to callback', function() {
      registerFakeAjax({
        url: 'a',
        error: {
          xhr: {
            status: 500,
            statusText: 'Internal Server Error',
            responseText: 'oh noez'
          },
          textStatus: 'fail',
          errorThrown: 'bad'
        }
      })
      $.ajax({
        url: 'a',
        error: function(xhr, textStatus, errorThrown) {
          result.xhr = xhr
          result.textStatus = textStatus
          result.errorThrown = errorThrown
        }
      })
      expect(result.xhr.status).toEqual(500)
      expect(result.xhr.statusText).toEqual('Internal Server Error')
      expect(result.xhr.responseText).toEqual('oh noez')
      expect(result.textStatus).toEqual('fail')
      expect(result.errorThrown).toEqual('bad')
    })

    it('allows using errorMessage convenience property for cases it is enough', function() {
      registerFakeAjax({
        url: 'a',
        errorMessage: 'fail'
      })
      $.ajax({
        url: 'a',
        error: function(xhr) {
          result.errorMessage = xhr.responseText
        }
      })
      expect(result.errorMessage).toEqual('fail')
    })
  })

  describe('array of callbacks', function() {
    it('success', function() {
      result.success.data = ""
      registerFakeAjax({
        url: 'a',
        success: [
          {data: 1},
          {data: 2},
          {data: 3}
        ]
      })
      $.ajax({
        url: 'a',
        success: [
          function(data) { result.success.data += ('a' + data) },
          function(data) { result.success.data += ('b' + data) },
          function(data) { result.success.data += ('c' + data) }
        ]
      })
      expect(result.success.data).toEqual('a1b2c3')
    })

    it('error', function() {
      var result = ""
      registerFakeAjax({
        url: 'a',
        error: [
          {xhr: {status: 404, responseText: '1'}},
          {xhr: {responseText: '2'}},
          {xhr: {responseText: '3', statusText: 'argh'}}        ]
      })
      $.ajax({
        url: 'a',
        error: [
          function(xhr) { result += ('a' + xhr.responseText + xhr.status) },
          function(xhr) { result += ('b' + xhr.responseText) },
          function(xhr) { result += ('c' + xhr.responseText + xhr.statusText) }
        ]
      })
      expect(result).toEqual('a1404b2c3argh')
    })
  })
})

describe('context option', function() {
  var Context

  beforeEach(function() {
    Context = {
      onSuccess: function(data) {},
      onError: function(xhr) {},
      onComplete: function() {}
    }
    spyOn(Context, 'onSuccess')
    spyOn(Context, 'onError')
    spyOn(Context, 'onComplete')
    fakeAjax({registrations:[
      {url: '/test/context/success', successData: 'success data'},
      {url: '/test/context/error', errorMessage: 'error message'},
      {url: '/test/context/complete', successData: 'any'}
    ]})
  })

  function callAjaxWithContext(url) {
    $.ajax({
      context: Context,
      url: url,
      success: function(data) {
        expect(this).toBe(Context)
        this.onSuccess(data)
      },
      error: function(xhr) {
        expect(this).toBe(Context)
        this.onError(xhr)
      },
      complete: function() {
        expect(this).toBe(Context)
        this.onComplete()
      }
    })
  }

  it('is supported for success callback', function() {
    callAjaxWithContext('/test/context/success')
    expect(Context.onSuccess).toHaveBeenCalledWith('success data')
  })

  it('is supported for error callback', function() {
    callAjaxWithContext('/test/context/error')
    expect(Context.onError).toHaveBeenCalledWith({responseText: 'error message'})
  })

  it('is supported for complete callback', function() {
    callAjaxWithContext('/test/context/complete')
    expect(Context.onComplete).toHaveBeenCalled()
  })
})

describe('logging', function() {
  var testLog

  function TestLog() {
    this.warnings = []
    this.errors = []
    this.latestWarning = function() { return _.last(this.warnings) }
    jasmine.FakeAjax.log.warn = function(message) {
      testLog.warnings.push(message)
    }
    jasmine.FakeAjax.log.error = function(message) {
      testLog.errors.push(message)
    }
  }

  var customMatchers = {
    toLogAndThrow: function(expectedMessage) {
      var result = false
      var exception
      try {
        this.actual()
      } catch (message) {
        exception = message
      }
      if (exception) {
        result = (this.env.equals_(exception, expectedMessage) && this.env.contains_(testLog.errors, expectedMessage))
      }
      this.message = function() {
        return "Expected function to log and throw '" + expectedMessage + "'. Logged error messages: [" + testLog.errors + "]. Actual error message thrown  by the function was '" + exception + "'."
      }
      return result
    }
  }

  beforeEach(function() {
    this.addMatchers(customMatchers)
    testLog = new TestLog()
  })

  describe('without fake ajax options', function() {
    it('logs warning', function() {
      $.get('/example')
      expect(testLog.latestWarning()).toEqual("There are no fake ajax options defined, spec: 'logs warning', real ajax url: '/example'.")
    })
  })

  describe('without matching url', function() {
    it('logs warning with real url and spec description', function() {
      fakeAjax({registrations:[{url: '/this'}]})
      $.get('/that', function(){})
      expect(testLog.latestWarning()).toEqual("No matching fake ajax options was found, spec: 'logs warning with real url and spec description', real ajax url: '/that'.")
    })
  })

  describe('without success handler in real options (though successData is defined in fake options)', function() {
    it('logs and throws error message', function() {
      fakeAjax({registrations:[{url: 'a', successData: 1}]})
      expect(function() {
        $.get('a')
      }).toLogAndThrow("Ajax success handler is not defined in system under test for url 'a'.")
    })
  })

  describe('without error handler in real options (though errorMessage is defined in fake options)', function() {
    it('logs and throws error message', function() {
      fakeAjax({registrations:[{url: 'a', errorMessage: 1}]})
      expect(function() {
        $.get('a')
      }).toLogAndThrow("Ajax error handler is not defined in system under test for url 'a'.")
    })
  })

  describe('when no callback instruction is specified', function() {
    it('logs and throws error message', function() {
      fakeAjax({registrations:[{url: 'a'}]})
      expect(function() {
        $.get('a')
      }).toLogAndThrow("Exactly one callback rule of success,successData,error,errorMessage must be defined for url 'a'. There was none.")
    })
  })

  describe('when fake success is an array but real success is not', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        success: []
      })
      expect(function() {
        $.ajax({
          url: 'a',
          success: function(){}
        })
      }).toLogAndThrow("Fake success must be an (success arguments) object when real success is a function for url 'a'.")
    })
  })

  describe('when real success has different number of items than fake success', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        success: [1]
      })
      expect(function() {
        $.ajax({
          url: 'a',
          success: [1, 2]
        })
      }).toLogAndThrow("Fake success has 1 items but real success has 2 items for url 'a'.")
    })
  })

  describe('when fake success is given but real success is not a function or an array', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        success: {}
      })
      expect(function() {
        $.ajax({
          url: 'a',
          success: "foo"
        })
      }).toLogAndThrow("Real success must be a function or an array of functions for url 'a'.")
    })
  })

  describe('when fake error is an array but real error is not', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        error: []
      })
      expect(function() {
        $.ajax({
          url: 'a',
          error: function(){}
        })
      }).toLogAndThrow("Fake error must be an (error arguments) object when real error is a function for url 'a'.")
    })
  })

  describe('when real error is an array but fake error is not', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        error: {}
      })
      expect(function() {
        $.ajax({
          url: 'a',
          error: []
        })
      }).toLogAndThrow("Real error is an array but fake error is not for url 'a'.")
    })
  })

  describe('when real error has different number of items than fake error', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        error: [1]
      })
      expect(function() {
        $.ajax({
          url: 'a',
          error: [1, 2]
        })
      }).toLogAndThrow("Fake error has 1 items but real error has 2 items for url 'a'.")
    })
  })

  describe('when fake error is given but real error is not a function or an array', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({
        url: 'a',
        error: {}
      })
      expect(function() {
        $.ajax({
          url: 'a',
          error: "foo"
        })
      }).toLogAndThrow("Real error must be a function or an array of functions for url 'a'.")
    })
  })

  describe('when more than one callback rule is given', function() {
    it('logs and throws error message', function() {
      registerFakeAjax({url: 'a', error: {}, successData: 'any', success: {}})
      expect(function() {
        $.get('a', successHandler)
      }).toLogAndThrow("Exactly one callback rule of success,successData,error,errorMessage must be defined for url 'a'. There was 3: success,successData,error.")
    })
  })

  describe('when fixture is not found', function() {
    it('logs and throws error message', function() {
      expect(function() {
        loadTestData('.any', 'unknown-fixture.html')
      }).toLogAndThrow("Failed loading test data by url 'unknown-fixture.html'.")
    })
  })

  describe('when test data is not found from fixture', function() {
    it('logs and throws error message', function() {
      expect(function() {
        loadTestData('.unknown', 'example-fixture.html')
      }).toLogAndThrow("Failed loading test data by selector '.unknown' from url 'example-fixture.html'.")
    })
  })

  describe('when latest ajax is not found', function() {
    it('logs and throws error message with spec description', function() {
      expect(function() {
        latestAjax()
      }).toLogAndThrow("Ajax hasn't yet been called in spec 'logs and throws error message with spec description'.")
    })
  })

  describe('when matching url is not found', function() {
    it('logs and throws error message with partial url and spec description', function() {
      expect(function() {
        latestAjaxWithUrlMatching('/not-found')
      }).toLogAndThrow("Matching url was not found by partial url '/not-found' in spec 'logs and throws error message with partial url and spec description'.")
    })
  })
})

// Test helpers

var result

function successHandler(data, status, xhr) {
  result.success.data = data
  result.success.status = status
  result.success.xhr = xhr
}

beforeEach(function() {
  result = {
    success: {},
    error: {}
  }
})

