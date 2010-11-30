function fakeAjax(options) { jasmine.FakeAjax.initContext(options); }
function clearContext() { fakeAjax({}); }
function loadTestData(selector, url) { return jasmine.FakeAjax.loadTestData(selector, url); }
function latestAjax() { return jasmine.FakeAjax.latestAjax(); }
function latestAjaxWithUrlMatching(partialUrl) { return jasmine.FakeAjax.latestAjaxWithUrlMatching(partialUrl); }

beforeEach(clearContext);

(function($, jasmine) {
  jasmine.FakeAjax = {
    realAjax: $.ajax,
    initContext: initContext,
    loadTestData: loadTestData,
    latestAjax: latestAjax,
    latestAjaxWithUrlMatching: latestAjaxWithUrlMatching,
    log: new Logger()
  };

  $.ajax = function(options) {
    jasmine.FakeAjax.recordedSession.addAjaxCall(options);
    if (options.beforeSend) {
      options.beforeSend();
    }
    var urls = jasmine.FakeAjax.urls;
    if (!urls) {
      jasmine.FakeAjax.log.warn("There are no ajax url mappings defined. Actual ajax url was '" + options.url + "'.");
    } else if (!urls[options.url]) {
      jasmine.FakeAjax.log.warn("Applying default success data for url '" + options.url + "' in spec '" + jasmine.getEnv().currentSpec.description + "'.");
      if (!options.success) {
        jasmine.FakeAjax.log.error("Ajax success handler is not defined in system under test for url '" + options.url + "'. See firebug script stack for more info.");
      } else {
        options.success("default success data");
      }
    } else if (urls[options.url].successData) {
      options.success(urls[options.url].successData);
    } else if (urls[options.url].errorMessage) {
      options.error({responseText: urls[options.url].errorMessage});
    } else {
      jasmine.FakeAjax.log.error("Unknown mapping value for url '" + options.url + "'. Expected either successData or errorMessage. Actual is '" + urls[options.url] + "'");
    }
    if (options.complete) {
      options.complete();
    }
  };

  function initContext(options) {
    this.urls = options.urls;
    this.recordedSession = new RecordedSession();
  }

  function loadTestData(selector, url) {
    var fixture;
    jasmine.FakeAjax.realAjax({
      url: url,
      async: false,
      success: function(data) {
        fixture = data;
      },
      error: function() {
        jasmine.FakeAjax.log.error("Failed loading test data by url '" + url + "'.");
      }
    });
    var testDataContainer = $(fixture).find(selector);
    if (testDataContainer.length > 0) {
      return testDataContainer.html();
    } else {
      jasmine.FakeAjax.log.error("Failed loading test data by selector '" + selector + "' from url '" + url + "'. Whole fixture: " + fixture);
      return undefined;
    }
  }

  function latestAjax() {
    return lastWithUrlDecoded(jasmine.FakeAjax.recordedSession.ajaxCalls, null);
  }

  function latestAjaxWithUrlMatching(partialUrl) {
    return lastWithUrlDecoded($(jasmine.FakeAjax.recordedSession.ajaxCalls).filter(function(index, ajaxOptions) {
      return ajaxOptions.url.match(partialUrl);
    }), partialUrl);
  }

  function lastWithUrlDecoded(ajaxOptions, partialUrl) {
    if (ajaxOptions.length === 0) {
      jasmine.FakeAjax.log.error("Matching url was not found by partial url '" + partialUrl + "' in spec '" + jasmine.getEnv().currentSpec.description + "'.");
      return {};
    }
    var last = ajaxOptions[ajaxOptions.length - 1];
    last.url = $.URLDecode(last.url);
    return last;
  }

  function RecordedSession() {
    this.ajaxCalls = [];

    this.addAjaxCall = function(ajaxOptions) {
      this.ajaxCalls.push(ajaxOptions);
    }
  }

  function Logger() {
    this.error = function(message) {
      withFirebugConsole(function(c) {
        c.error(message);
        debugger;
      });
    }

    this.warn = function(message) {
      withFirebugConsole(function(c) {
        c.warn(message);
      });
    }

    function withFirebugConsole(callback) {
      if (window.console) {
        callback(window.console);
      }
    }
  }
})(jQuery, jasmine);
