var context;
var realAjax = jQuery.ajax;
var log = new Logger();

afterEach(clearContext);

function createContext(options) {
  context = {
    ajax: options.ajax || {},
    recordedSession: new RecordedSession()
  };
}

function clearContext() {
  createContext({});
}

jQuery.ajax = function(ajaxOptions) {
  if (!context) {
    log.error("Context is not initialized. Create it by calling createContext(options). in .beforeEach");
  }
  context.recordedSession.addAjaxCall(ajaxOptions);
  if (!context.ajax.urls) {
    log.warn("There are no ajax url mappings defined in context.");
  } else if (!context.ajax.urls[ajaxOptions.url]) {
    log.warn("Applying default success data for url '" + ajaxOptions.url + "'");
    if (!ajaxOptions.success) {
      log.error("Ajax success handler is not defined in system under test for url '" + ajaxOptions.url + "' See firebug script stack for more info.");
    } else {
      ajaxOptions.success("default success data");
    }
  } else if (context.ajax.urls[ajaxOptions.url].successData) {
    ajaxOptions.success(context.ajax.urls[ajaxOptions.url].successData);
  } else if (context.ajax.urls[ajaxOptions.url].errorMessage) {
    ajaxOptions.error({responseText: context.ajax.urls[ajaxOptions.url].errorMessage});
  } else {
    log.error("Unknown fake ajax configuration in context.");
  }
}

function loadTestData(selector, url) {
  var fixture;
  realAjax({
    url: url,
    async: false,
    success: function(data) {
      fixture = data;
    },
    error: function() {
      log.error("Failed loading test data by url '" + url + "'.");
    }
  });
  var testDataContainer = $(fixture).find(selector);
  if (testDataContainer.length > 0) {
    return testDataContainer.html();
  } else {
    log.error("Failed loading test data by selector: '" + selector + "' from url: '" + url + "'. Whole fixture: " + fixture);
    return undefined;
  }
}

function latestAjaxUrlMatching(partialUrl) {
  var matchingUrls = context.recordedSession.ajaxUrls().filter(function(url) {
    return url.match(partialUrl);
  });
  return $.URLDecode(matchingUrls[matchingUrls.length - 1]);
}

function latestAjaxUrl() {
  var urls = context.recordedSession.ajaxUrls();
  return $.URLDecode(urls[urls.length - 1]);
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
