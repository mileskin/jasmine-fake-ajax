var fakeAjax = function(options) {
  jasmine.FakeAjax.initContext(options);
};

var loadTestData = function(selector, url) {
  var fixture;
  jasmine.FakeAjax.originalAjax({
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
    jasmine.FakeAjax.log.error("Failed loading test data by selector: '" + selector + "' from url: '" + url + "'. Whole fixture: " + fixture);
    return undefined;
  }
};

var latestAjaxUrlMatching = function(partialUrl) {
  var matchingUrls = jasmine.FakeAjax.recordedSession.ajaxUrls().filter(function(url) {
    return url.match(partialUrl);
  });
  return $.URLDecode(matchingUrls[matchingUrls.length - 1]);
};

var latestAjaxUrl = function() {
    var urls = jasmine.FakeAjax.recordedSession.ajaxUrls();
    return $.URLDecode(urls[urls.length - 1]);
};

(function($, jasmine) {
  jasmine.FakeAjax = {
    originalAjax: $.ajax,
    initContext: function(options) {
      this.urls = options.urls;
      this.recordedSession = new RecordedSession();
    },
    log: new Logger()
  };

  $.ajax = function(ajaxOptions) {
    jasmine.FakeAjax.recordedSession.addAjaxCall(ajaxOptions);
    if (!jasmine.FakeAjax.urls) {
      jasmine.FakeAjax.log.warn("There are no ajax url mappings defined.");
    } else if (!jasmine.FakeAjax.urls[ajaxOptions.url]) {
      jasmine.FakeAjax.log.warn("Applying default success data for url '" + ajaxOptions.url + "'");
      if (!ajaxOptions.success) {
        jasmine.FakeAjax.log.error("Ajax success handler is not defined in system under test for url '" + ajaxOptions.url + "' See firebug script stack for more info.");
      } else {
        ajaxOptions.success("default success data");
      }
    } else if (jasmine.FakeAjax.urls[ajaxOptions.url].successData) {
      ajaxOptions.success(jasmine.FakeAjax.urls[ajaxOptions.url].successData);
    } else if (jasmine.FakeAjax.urls[ajaxOptions.url].errorMessage) {
      ajaxOptions.error({responseText: jasmine.FakeAjax.urls[ajaxOptions.url].errorMessage});
    } else {
      jasmine.FakeAjax.log.error("Unknown fake ajax configuration.");
    }
  };

  function RecordedSession() {
    this.ajaxCalls = [];

    this.addAjaxCall = function(ajaxOptions) {
      this.ajaxCalls.push(ajaxOptions);
    }

    this.ajaxUrls = function() {
      return this.ajaxCalls.map(function(ajaxOptions) {
        return ajaxOptions.url;
      });
    }
  }

  function Logger() {
    this.error = function(message) {
      if (window.console) {
        console.error(message);
        debugger;
      }
    }

    this.warn = function(message) {
      if (window.console) {
        console.warn(message);
      }
    }
  }
})(jQuery, jasmine);
