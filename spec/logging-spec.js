describe("logging", function() {
  var testLog;

  function TestLog() {
    this.warnings = [];
    this.errors = [];
    this.latestWarning = function() { return this.warnings[this.warnings.length - 1]; };
    this.latestError = function() { return this.errors[this.errors.length - 1]; };
    jasmine.FakeAjax.log.warn = function(message) {
      testLog.warnings.push(message);
    };
    jasmine.FakeAjax.log.error = function(message) {
      testLog.errors.push(message);
    };
  }

  var customMatchers = {
    toLogAndThrow: function(expectedMessage) {
      var result = false;
      var exception;
      try {
        this.actual();
      } catch (message) {
        exception = message;
      }
      if (exception) {
        result = (this.env.equals_(exception, expectedMessage) && this.env.contains_(testLog.errors, expectedMessage));
      }
      this.message = function() {
        return "Expected function to log and throw '" + expectedMessage + "'. Logged error messages are [" + testLog.errors + "]. Actual error message thrown  by the function was '" + exception + "'.";
      };
      return result;
    }
  };

  beforeEach(function() {
    this.addMatchers(customMatchers);
    testLog = new TestLog();
  });

  describe("without url mappings", function() {
    beforeEach(function() {
      $.get('/example');
    });

    it("logs warning", function() {
      expect(testLog.latestWarning()).toEqual("There are no ajax url mappings defined. Actual ajax url was '/example'.");
    });
  });

  describe("without matching url", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/this": {successData: "any"}}});
      $.get('/that', function(){});
    });

    it("logs warning with actual url and spec description", function() {
      expect(testLog.latestWarning()).toEqual("Applying default success data for url '/that' in spec 'logs warning with actual url and spec description'.");
    });
  });

  describe("without success handler in system under test", function() {
    it("logs and throws error message", function() {
      expect(function() {
        fakeAjax({urls: {}});
        $.get('/example');
      }).toLogAndThrow("Ajax success handler is not defined in system under test for url '/example'. See firebug script stack for more info.");
    });
  });

  describe("with unknown url mapping value", function() {
    it("logs and throws error message", function() {
      expect(function() {
        fakeAjax({urls: {"/example": 'invalid'}});
        $.get('/example');
      }).toLogAndThrow("Unknown mapping value for url '/example'. Expected either successData or errorMessage. Actual was 'invalid'");
    });
  });

  describe("when fixture is not found", function() {
    it("logs and throws error message", function() {
      expect(function() {
        loadTestData('.any', 'unknown-fixture.html')
      }).toLogAndThrow("Failed loading test data by url 'unknown-fixture.html'.");
    });
  });

  describe("when test data is not found from fixture", function() {
    it("logs and throws error message", function() {
      expect(function() {
        loadTestData('.unknown', 'example-fixture.html')
      }).toLogAndThrow("Failed loading test data by selector '.unknown' from url 'example-fixture.html'. Whole fixture: <html><body><div class=\"fixture\"></div></body></html>");
    });
  });

  describe('when latest ajax is not found', function() {
    it('logs and throws error message with spec description', function() {
      expect(function() {
        latestAjax()
      }).toLogAndThrow("Ajax hasn't yet been called in spec 'logs and throws error message with spec description'.");
    });
  });

  describe('when matching url is not found', function() {
    it('logs and throws error message with partial url and spec description', function() {
      expect(function() {
        latestAjaxWithUrlMatching('/notfound')
      }).toLogAndThrow("Matching url was not found by partial url '/notfound' in spec 'logs and throws error message with partial url and spec description'.");
    });
  });
});
