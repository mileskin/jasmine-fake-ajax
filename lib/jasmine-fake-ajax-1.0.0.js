var fakeAjax = function(options) {
  jasmine.FakeAjax.initContext({urls: options.urls});
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
  var matchingUrls = jasmine.FakeAjax.getRecordedSession().ajaxUrls().filter(function(url) {
    return url.match(partialUrl);
  });
  return $.URLDecode(matchingUrls[matchingUrls.length - 1]);
};

var latestAjaxUrl = function() {
    var urls = jasmine.FakeAjax.getRecordedSession().ajaxUrls();
    return $.URLDecode(urls[urls.length - 1]);
};

(function($, jasmine) {
  var context = null;

  jasmine.FakeAjax = {
    originalAjax: $.ajax,
    initContext: initContext,
    getUrls: getUrls,
    getRecordedSession: getRecordedSession,
    log: new Logger()
  };

  jQuery.ajax = function(ajaxOptions) {
    if (!jasmine.FakeAjax) {
      jasmine.FakeAjax.log.error("Fake ajax is not initialized. Create it by calling .fakeAjax in .beforeEach");
    }
    jasmine.FakeAjax.getRecordedSession().addAjaxCall(ajaxOptions);
    if (!jasmine.FakeAjax.getUrls()) {
      jasmine.FakeAjax.log.warn("There are no ajax url mappings defined.");
    } else if (!jasmine.FakeAjax.getUrls()[ajaxOptions.url]) {
      jasmine.FakeAjax.log.warn("Applying default success data for url '" + ajaxOptions.url + "'");
      if (!ajaxOptions.success) {
        jasmine.FakeAjax.log.error("Ajax success handler is not defined in system under test for url '" + ajaxOptions.url + "' See firebug script stack for more info.");
      } else {
        ajaxOptions.success("default success data");
      }
    } else if (jasmine.FakeAjax.getUrls()[ajaxOptions.url].successData) {
      ajaxOptions.success(jasmine.FakeAjax.getUrls()[ajaxOptions.url].successData);
    } else if (jasmine.FakeAjax.getUrls()[ajaxOptions.url].errorMessage) {
      ajaxOptions.error({responseText: jasmine.FakeAjax.getUrls()[ajaxOptions.url].errorMessage});
    } else {
      jasmine.FakeAjax.log.error("Unknown fake ajax configuration.");
    }
  };

  function initContext(con) {
    context = con;
    context.RecordedSession = new RecordedSession();
  }

  function getUrls() {
    return context.urls;
  }

  function getRecordedSession() {
    return context.RecordedSession;
  }

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
