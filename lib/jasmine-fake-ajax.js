(function($, jasmine) {
  // Public interface.
  jasmine.FakeAjax = {
    realAjax: $.ajax,
    initContext: initContext,
    loadTestData: loadTestData,
    latestAjax: latestAjax,
    latestAjaxWithUrlMatching: latestAjaxWithUrlMatching,
    log: new Logger()
  }

  $.ajax = function(realOptions) {
    jasmine.FakeAjax.recordedSession.addRealOptions(realOptions)
    var allFakeOptions = jasmine.FakeAjax.recordedSession.allFakeOptions
    if (!_.isEmpty(allFakeOptions)) {
      var fakeOptions = findMatchingFakeOptions(realOptions, allFakeOptions)
      if (_.isEmpty(fakeOptions)) {
        jasmine.FakeAjax.log.warn(messageWithContextInfo("No matching fake ajax options was found", realOptions))
      } else {
        callAvailableCallbackHandlers(realOptions, fakeOptions)
      }
    } else {
      jasmine.FakeAjax.log.warn(messageWithContextInfo("There are no fake ajax options defined", realOptions))
    }
  }

  function RecordedSession() {
    // All registered fake ajax options.
    this.allFakeOptions = []
    // All real ajax calls triggered by sut.
    this.allRealOptions = []

    this.registerFakeAjax = function(options) {
      this.allFakeOptions.push(options)
    }

    this.addRealOptions = function(options) {
      this.allRealOptions.push(options)
    }
  }

  function Logger() {
    this.error = function(message) {
      withFirebugConsole(function(c) {
        c.error(message)
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

  function initContext(options) {
    jasmine.FakeAjax.recordedSession = new RecordedSession()
    _.each(options.registrations, function(options) {
      jasmine.FakeAjax.recordedSession.registerFakeAjax(options)
    })
  }

  function loadTestData(selector, url) {
    var fixture
    jasmine.FakeAjax.realAjax({
      url: url,
      type: 'get',
      dataType: 'html',
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
      logAndThrow("Failed loading test data by selector '" + selector + "' from url '" + url + "'.")
    }
  }

  function latestAjax() {
    var allRealOptions = jasmine.FakeAjax.recordedSession.allRealOptions
    if (_.isEmpty(allRealOptions)) {
      logAndThrow("Ajax hasn't yet been called in spec '" + jasmine.getEnv().currentSpec.description + "'.")
    } else {
      return lastWithUrlDecoded(allRealOptions)
    }
  }

  function latestAjaxWithUrlMatching(partialUrl) {
    var matchingAjaxCalls = _.filter(jasmine.FakeAjax.recordedSession.allRealOptions, function(ajaxOptions) {
      return ajaxOptions.url.match(partialUrl)
    })
    if (_.isEmpty(matchingAjaxCalls)) {
      logAndThrow("Matching url was not found by partial url '" + partialUrl + "' in spec '" + jasmine.getEnv().currentSpec.description + "'.")
    } else {
      return lastWithUrlDecoded(matchingAjaxCalls)
    }
  }

  function lastWithUrlDecoded(ajaxOptions) {
    var last = _.last(ajaxOptions)
    last.url = $.URLDecode(last.url)
    return last
  }

  function logAndThrow(errorMessage) {
    jasmine.FakeAjax.log.error(errorMessage)
    throw errorMessage
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
    if (allMatchingFakeOptions.length > 1) {
      logAndThrow("Multiple matching fake ajax options found, not able to decide which callbacks to use because the result was ambiguous. " +
                  "Real ajax options: " + JSON.stringify(realOptions) + ". " +
                  "All matching (and thus conflicting) fake options: " + _.map(allMatchingFakeOptions, function(fakeOptions){ return JSON.stringify(fakeOptions) }))
    }
    return _.first(allMatchingFakeOptions)
  }

  function callAvailableCallbackHandlers(real, fake) {
    // check pre-condition
    if (!fake.success && !fake.successData && !fake.errorMessage) {
      logAndThrow("One of success, successData or errorMessage must be defined for url '" + real.url + "'.")
    }
    if ((fake.success || fake.successData) && !real.success) {
      logAndThrow("Ajax success handler is not defined in system under test for url '" + real.url + "'.")
    }
    if (fake.errorMessage && !real.error) {
      logAndThrow("Ajax error handler is not defined in system under test for url '" + real.url + "'.")
    }
    // call available handlers
    if (real.beforeSend) {
      real.beforeSend()
    }
    if (fake.success) {
      if (_.isFunction(fake.success)) {
        real.success.call(real.context, fake.successData)
      } else if (_.isArray(fake.success)) {
        if (!_.isArray(real.success)) {
          logAndThrow("Fake success is an array but real success is not for url '" + real.url + "'.")
        }
        if (!_.isEqual(fake.success.length, real.success.length)) {
          logAndThrow("Fake success has " + fake.success.length + " items but real success has " + real.success.length + " items for url '" + real.url + "'.")
        }
        _.each(_.zip(real.success, fake.success), function(realAndFakeSuccess) {
          realAndFakeSuccess[0].call(real.context, realAndFakeSuccess[1].data)
        })
      } else {
        logAndThrow("Fake success must be a function or an array of functions for url '" + real.url + "'.")
      }
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

  function messageWithContextInfo(message, realOptions) {
    return message + ", spec: '" + jasmine.getEnv().currentSpec.description + "', real ajax url: '" + realOptions.url + "'."
  }
})(jQuery, jasmine)

// Some global convenience functions.
function fakeAjax(options) { jasmine.FakeAjax.initContext(options) }
function registerFakeAjax(options) { jasmine.FakeAjax.recordedSession.registerFakeAjax(options) }
function loadTestData(selector, url) { return jasmine.FakeAjax.loadTestData(selector, url) }
function latestAjax() { return jasmine.FakeAjax.latestAjax() }
function latestAjaxWithUrlMatching(partialUrl) { return jasmine.FakeAjax.latestAjaxWithUrlMatching(partialUrl) }

beforeEach(function(){ fakeAjax({}) })

