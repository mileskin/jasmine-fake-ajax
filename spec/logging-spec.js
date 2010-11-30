describe("logging", function() {
  var latestWarning;
  var latestError;
  jasmine.FakeAjax.log.warn = function(message) {
    latestWarning = message;
  };
  jasmine.FakeAjax.log.error = function(message) {
    latestError = message;
  };

  beforeEach(function() {
    latestWarning = null;
    latestError = null;
  });

  describe("without url mappings", function() {
    beforeEach(function() {
      $.get('/example');
    });

    it("logs warning", function() {
      expect(latestWarning).toEqual("There are no ajax url mappings defined. Actual ajax url was '/example'.");
    });
  });

  describe("without matching url", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/this": {successData: "any"}}});
      $.get('/that');
    });

    it("logs warning", function() {
      expect(latestWarning).toEqual("Applying default success data for url '/that'.");
    });
  });

  describe("without success handler in system under test", function() {
    beforeEach(function() {
      fakeAjax({urls: {}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(latestError).toEqual("Ajax success handler is not defined in system under test for url '/example'. See firebug script stack for more info.");
    });
  });

  describe("with unknown url mapping value", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/example": {}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(latestError).toEqual("Unknown mapping value for url '/example'. Expected either successData or errorMessage.");
    });
  });
});
