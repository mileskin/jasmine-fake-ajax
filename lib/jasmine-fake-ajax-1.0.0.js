var context;
var realAjax = jQuery.ajax;
var log = new Logger();

afterEach(clearContext);

function createContext(options) {
  context = {
    ajax: options.ajax || {},
    recorded: {
      ajaxCalls: []
    }
  };
}

function clearContext() {
  createContext({});
}

jQuery.ajax = function(ajaxOptions) {
  context.recorded.ajaxCalls.push(ajaxOptions);
  
  if (!context.ajax || !context.recorded) {
    log.error("Context is not initialized. Create by calling createContext(options). in .beforeEach");
  } else if (!context.ajax.urls) {
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
  var matchingUrls = recordedAjaxUrls().filter(function(url) {
    return url.match(partialUrl);
  });
  return $.URLDecode(matchingUrls[matchingUrls.length - 1]);
}

function latestAjaxUrl() {
  var urls = recordedAjaxUrls();
  return $.URLDecode(urls[urls.length - 1]);
}

function recordedAjaxUrls() {
  return context.recorded.ajaxCalls.map(function(ajaxOptions) {
    return ajaxOptions.url;
  });
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
