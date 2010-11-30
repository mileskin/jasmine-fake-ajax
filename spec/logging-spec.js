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

describe("logging", function() {
  beforeEach(function() {
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
      $.get('/that');
    });

    it("logs warning with actual url and spec description", function() {
      expect(testLog.latestWarning()).toEqual("Applying default success data for url '/that' in spec 'logs warning with actual url and spec description'.");
    });
  });

  describe("without success handler in system under test", function() {
    beforeEach(function() {
      fakeAjax({urls: {}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(testLog.latestError()).toEqual("Ajax success handler is not defined in system under test for url '/example'. See firebug script stack for more info.");
    });
  });

  describe("with unknown url mapping value", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/example": 'invalid'}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(testLog.latestError()).toEqual("Unknown mapping value for url '/example'. Expected either successData or errorMessage. Actual is 'invalid'");
    });
  });

  describe("when fixture is not found", function() {
    beforeEach(function() {
      fakeAjax({urls: {'/example': {successData: loadTestData('.any', 'unknown-fixture.html')}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(testLog.errors).toContain("Failed loading test data by url 'unknown-fixture.html'.");
    });
  });

  describe("when test data is not found from fixture", function() {
    beforeEach(function() {
      fakeAjax({urls: {'/example': {successData: loadTestData('.unknown', 'example-fixture.html')}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(testLog.errors).toContain("Failed loading test data by selector '.unknown' from url 'example-fixture.html'. Whole fixture: <html><body><div class=\"fixture\"></div></body></html>");
    });
  });
});
