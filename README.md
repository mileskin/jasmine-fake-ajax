Fake Ajax to be used with Jasmine BDD framework.
================================================

See `spec/fake-ajax-spec.js` for live specification.

Usage in a nutshell: you provide a context which is a list of mappings from an URL to succes data or error message. When the spec is run, fake ajax is called and the data you have supplied will be passed to the real system under test.

You may inline the test data

  createContext({ajax: {urls: {"/succeeds": {successData: "Jasmine FTW!"}}}});

or load the test data using `loadTestData`. Here we load the contents of .questions from fake-ajax-fixture.html

  createContext({ajax: {urls: {"/questions/list": {successData: loadTestData(".questions", "fake-ajax-fixture.html")}}}});

and when you need the error handler to be called you can

  createContext({ajax: {urls: {"/fails": {errorMessage: ":-("}}}});

Often, multiple Ajax calls are executed under the hood when e.g. clicking a link. `createContext` lets you define which calls will succeed and which will fail:

  createContext({
    ajax: {
      urls: {
        "/answers/get?questionId=question2": {successData: loadTestData(".answer2", "fake-ajax-fixture.html")},
        "/authors/get?answerId=answer2": {errorMessage: "author data not available"},
        "/onError": {successData: "Please try again later."}
      }
    }
  });

You are not forced to define any context. Possibly you are only interested in what is sent to the server? Then you can do

  expect(latestAjaxUrlMatching("second")).toContain("foo=bar");

Warnings and errors during the spec run are logged into the firebug console, so you should consider keeping it open.

Hope you enjoy!
