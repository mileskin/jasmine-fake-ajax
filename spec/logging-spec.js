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

  describe('when no successData or errorMessage is defined', function() {
    it('logs and throws error message', function() {
      fakeAjax({registrations:[{url: 'a'}]})
      expect(function() {
        $.get('a')
      }).toLogAndThrow("Either successData or errorMessage must be defined for url 'a'.")
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

