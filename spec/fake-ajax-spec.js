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

// Fake AJAX with DOM, single AJAX call. Response test data is loaded using .loadTestData.

describe('showing questions', function() {
  beforeEach(function() {
    setFixtures('<button class="showQuestions"/><div class="questions"></div>')
    sut.setupQuestionsBehavior()
  })

  describe('succeeds', function() {
    beforeEach(function() {
      fakeAjax({urls: {'/questions/list': {successData: loadTestData('.questions', 'fake-ajax-fixture.html')}}})
      $('.showQuestions').click()
    })

    it('shows the list of questions fetched from server', function() {
      expect($('.question').length).toEqual(3)
      expect($('.question').last()).toHaveText('Question 3')
    })
  })

  describe('fails', function() {
    beforeEach(function() {
      fakeAjax({urls: {'/questions/list': {errorMessage: 'Failed loading questions.'}}})
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
      fakeAjax({urls: {'/succeeds': {successData: 'Jasmine FTW!'}}})
    })

    it('counts response length', function() {
      expect(sut.countResponseLength({url: '/succeeds'})).toEqual(12)
    })
  })

  describe('fails', function() {
    beforeEach(function() {
      fakeAjax({urls: {'/fails': {errorMessage: 'argh'}}})
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
      fakeAjax({
        urls: {
          '/answers/get?questionId=question2': {successData: loadTestData('.answer2', 'fake-ajax-fixture.html')},
          '/authors/get?answerId=answer2': {errorMessage: 'author data not available'},
          '/onError': {successData: 'Please try again later.'}
        }
      })
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
    fakeAjax({urls: {'/user': {successData: {name: 'John', age: 30}}}})
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
    fakeAjax({urls: {'/example': {successData: 'yay'}}})
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
    fakeAjax({urls: {
      '/test/context/success': {successData: 'success data'},
      '/test/context/error': {errorMessage: 'error message'},
      '/test/context/complete': {successData: 'any'}
    }})
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
