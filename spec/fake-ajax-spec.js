var result
var successHandler = function(data) { result = data }

describe('simple example', function() {
  it('just works', function() {
    registerFakeAjax({url: '/simple', successData: 'world!'})
    var message = 'hello '
    $.get('/simple', function(data) {
      message += data
    })
    expect(message).toEqual('hello world!')
  })
})

describe('rules for resolving which fake ajax options match the real options', function() {
  it('default type is get', function() {
    registerFakeAjax({url: '/a', successData: 1})
    $.get('/a', successHandler)
    expect(result).toEqual(1)
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
    expect(result).toEqual(2)

    $.post('/a', successHandler)
    expect(result).toEqual(3)

    $.ajax({url: '/b', type: 'put', dataType: 'json', async: false, data: {user: 'bob', age: 30}, success: successHandler})
    expect(result).toEqual(4)

    $.ajax({url: '/c', data: {age: 99}, async: true, success: successHandler})
    expect(result).toEqual(6)
  })

  it('compares url', function() {
    fakeAjax({registrations:[
      {url: '/a', successData: 1},
      {url: '/b', successData: 2}
    ]})
    $.get('/b', successHandler)
    expect(result).toEqual(2)
  })

  it('compares type', function() {
    fakeAjax({registrations:[
      {type: 'put', successData: 1},
      {type: 'delete', successData: 2}
    ]})
    $.ajax({type: 'delete', success: successHandler})
    expect(result).toEqual(2)
  })

  it('compares data', function() {
    fakeAjax({registrations:[
      {data: {user: 'dog'}, successData: 1},
      {data: {user: 'cat'}, successData: 2}
    ]})
    $.ajax({data: {user: 'cat'}, success: successHandler})
    expect(result).toEqual(2)
  })

  it('compares dataType', function() {
    fakeAjax({registrations:[
      {dataType: 'json', successData: 1},
      {dataType: 'xml', successData: 2}
    ]})
    $.ajax({dataType: 'json', success: successHandler})
    expect(result).toEqual(1)
  })

  it('compares async', function() {
    fakeAjax({registrations:[
      {async: true, successData: 1},
      {async: false, successData: 2}
    ]})
    $.ajax({async: true, success: successHandler})
    expect(result).toEqual(1)
  })
})

describe('registering fake ajax options', function() {
  it('allows adding options groupped and/or one by one', function() {
    registerFakeAjax({url: 'a', successData: 1})
    fakeAjax({registrations:[
      {url: 'b', successData: 2},
      {url: 'c', successData: 3}
    ]})
    registerFakeAjax({url: 'd', successData: 4})
    $.ajax({url: 'a', success: successHandler})
    expect(result).toEqual(1)
    $.ajax({url: 'b', success: successHandler})
    expect(result).toEqual(2)
    $.ajax({url: 'c', success: successHandler})
    expect(result).toEqual(3)
    $.ajax({url: 'd', success: successHandler})
    expect(result).toEqual(4)
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

