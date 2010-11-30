describe("logging", function() {
  var warnings;
  var errors;
  function latestWarning() { return warnings[warnings.length - 1]; }
  function latestError() { return errors[errors.length - 1]; }
  jasmine.FakeAjax.log.warn = function(message) {
    warnings.push(message);
  };
  jasmine.FakeAjax.log.error = function(message) {
    errors.push(message);
  };

  beforeEach(function() {
    warnings = [];
    errors = [];
  });

  describe("without url mappings", function() {
    beforeEach(function() {
      $.get('/example');
    });

    it("logs warning", function() {
      expect(latestWarning()).toEqual("There are no ajax url mappings defined. Actual ajax url was '/example'.");
    });
  });

  describe("without matching url", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/this": {successData: "any"}}});
      $.get('/that');
    });

    it("logs warning", function() {
      expect(latestWarning()).toEqual("Applying default success data for url '/that'.");
    });
  });

  describe("without success handler in system under test", function() {
    beforeEach(function() {
      fakeAjax({urls: {}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(latestError()).toEqual("Ajax success handler is not defined in system under test for url '/example'. See firebug script stack for more info.");
    });
  });

  describe("with unknown url mapping value", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/example": {}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(latestError()).toEqual("Unknown mapping value for url '/example'. Expected either successData or errorMessage.");
    });
  });

  describe("when fixture is not found", function() {
    beforeEach(function() {
      fakeAjax({urls: {'/example': {successData: loadTestData('.any', 'unknown-fixture.html')}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(errors).toContain("Failed loading test data by url 'unknown-fixture.html'.");
    });
  });

  describe("when test data is not found from fixture", function() {
    beforeEach(function() {
      fakeAjax({urls: {'/example': {successData: loadTestData('.unknown', 'example-fixture.html')}}});
      $.get('/example');
    });

    it("logs error", function() {
      expect(errors).toContain("Failed loading test data by selector: '.unknown' from url: 'example-fixture.html'. Whole fixture: <html><body><div class=\"fixture\"></div></body></html>");
    });
  });
});
