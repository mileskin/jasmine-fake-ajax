(function($, jasmine) {
  function _initContext(options) {
    this.allFakeOptions = options.mappings
    this.recordedSession = new RecordedSession()
  }

  function _loadTestData(selector, url) {
    var fixture
    jasmine.FakeAjax.realAjax({
      url: url,
      async: false,
      success: function(data) {
        fixture = data
      },
      error: function() {
        logAndThrow("Failed loading test data by url '" + url + "'.")
      }
    })
    var testDataContainer = $(fixture).find(selector)
    if (testDataContainer.length > 0) {
      return testDataContainer.html()
    } else {
      logAndThrow("Failed loading test data by selector '" + selector + "' from url '" + url + "'. Whole fixture: " + fixture)
      return null // to get rid of IDE warning, this line is unreachable
    }
  }

  function _latestAjax() {
    var ajaxCalls = jasmine.FakeAjax.recordedSession.ajaxCalls
    if (ajaxCalls.length === 0) {
      logAndThrow("Ajax hasn't yet been called in spec '" + jasmine.getEnv().currentSpec.description + "'.")
      return null // to get rid of IDE warning, this line is unreachable
    } else {
      return lastWithUrlDecoded(ajaxCalls)
    }
  }

  function _latestAjaxWithUrlMatching(partialUrl) {
    var matchingAjaxCalls = _.filter(jasmine.FakeAjax.recordedSession.ajaxCalls, function(ajaxOptions) {
      return ajaxOptions.url.match(partialUrl)
    })
    if (matchingAjaxCalls.length === 0) {
      logAndThrow("Matching url was not found by partial url '" + partialUrl + "' in spec '" + jasmine.getEnv().currentSpec.description + "'.")
      return null // to get rid of IDE warning, this line is unreachable
    } else {
      return lastWithUrlDecoded(matchingAjaxCalls)
    }
  }

  function lastWithUrlDecoded(ajaxOptions) {
    var last = ajaxOptions[ajaxOptions.length - 1]
    last.url = $.URLDecode(last.url)
    return last
  }

  function logAndThrow(errorMessage) {
    jasmine.FakeAjax.log.error(errorMessage)
    throw errorMessage
  }

  function RecordedSession() {
    this.ajaxCalls = []

    this.addAjaxCall = function(ajaxOptions) {
      this.ajaxCalls.push(ajaxOptions)
    }
  }

  function Logger() {
    this.error = function(message) {
      withFirebugConsole(function(c) {
        c.error(message)
        debugger
      })
    }

    this.warn = function(message) {
      withFirebugConsole(function(c) {
        c.warn(message)
      })
    }

    function withFirebugConsole(callback) {
      if (window.console) {
        callback(window.console)
      }
    }
  }

  jasmine.FakeAjax = {
    realAjax: $.ajax,
    initContext: _initContext,
    loadTestData: _loadTestData,
    latestAjax: _latestAjax,
    latestAjaxWithUrlMatching: _latestAjaxWithUrlMatching,
    log: new Logger()
  }

  function findMatchingFakeOptions(realOptions, allFakeOptions) {
    var comparableFields = ['url', 'type', 'data', 'dataType', 'async']
    var allMatchingFakeOptions = _.select(allFakeOptions, function(fakeOptions) {
      var real = _.clone(realOptions)
      var fake = _.clone(fakeOptions)
      _.each([real, fake], function(o) {
        o.type = o.type || 'get'
        o.type = o.type.toLowerCase()
      })
      return _.all(comparableFields, function(field) {
        return _.isUndefined(fake[field]) ? true : _.isEqual(fake[field], real[field])
      })
    })
    if (allMatchingFakeOptions.length === 0) {
      jasmine.FakeAjax.log.warn("Applying default success data in spec '" + jasmine.getEnv().currentSpec.description +
                                "' because no matching fake ajax options was found. Real ajax url was '" + realOptions.url + "'.")
      allMatchingFakeOptions = [{successData: 'default success data'}]
    } else if (allMatchingFakeOptions.length > 1) {
      logAndThrow("Multiple matching fake ajax options found, not able to decide which callbacks to use because the result was ambiguous. " +
                  "Real ajax options: " + JSON.stringify(realOptions) + ". " +
                  "All matching (and thus conflicting) fake options: " + _.map(allMatchingFakeOptions, function(fakeOptions){ return JSON.stringify(fakeOptions) }))
    }
    return _.first(allMatchingFakeOptions)
  }

  function callAvailableCallbackHandlers(real, fake) {
    // check pre-condition
    if (!fake.successData && !fake.errorMessage) {
      logAndThrow("Either successData or errorMessage must be defined for url '" + real.url + "'.")
    }
    if (fake.successData && !real.success) {
      logAndThrow("Ajax success handler is not defined in system under test for url '" + real.url + "'.")
    }
    if (fake.errorMessage && !real.error) {
      logAndThrow("Ajax error handler is not defined in system under test for url '" + real.url + "'.")
    }
    // call available handlers
    if (real.beforeSend) {
      real.beforeSend()
    }
    if (fake.successData) {
      real.success.call(real.context, fake.successData)
    }
    if (fake.errorMessage) {
      real.error.call(real.context, {responseText: fake.errorMessage})
    }
    if (real.complete) {
      real.complete.call(real.context)
    }
  }

  $.ajax = function(realOptions) {
    jasmine.FakeAjax.recordedSession.addAjaxCall(realOptions)
    var allFakeOptions = jasmine.FakeAjax.allFakeOptions
    if (allFakeOptions) {
      var fakeOptions = findMatchingFakeOptions(realOptions, allFakeOptions)
      callAvailableCallbackHandlers(realOptions, fakeOptions)
    } else {
      jasmine.FakeAjax.log.warn("There are no fake ajax options defined. Real ajax url was '" + realOptions.url + "'.")
    }
  }
})(jQuery, jasmine)

function fakeAjax(options) { jasmine.FakeAjax.initContext(options) }
function clearContext() { fakeAjax({}) }
function loadTestData(selector, url) { return jasmine.FakeAjax.loadTestData(selector, url) }
function latestAjax() { return jasmine.FakeAjax.latestAjax() }
function latestAjaxWithUrlMatching(partialUrl) { return jasmine.FakeAjax.latestAjaxWithUrlMatching(partialUrl) }

beforeEach(clearContext)

