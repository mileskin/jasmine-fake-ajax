// Fake AJAX with DOM, single AJAX call. Response test data is loaded using .loadTestData.

describe("showing questions", function() {
  beforeEach(function() {
    setFixtures('<button class="showQuestions"/><div class="questions"></div>');
    setupQuestionsBehavior();
  });

  describe("succeeds", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/questions/list": {successData: loadTestData(".questions", "fake-ajax-fixture.html")}}});
      $(".showQuestions").click();
    });

    it("shows the list of questions fetched from server", function() {
      expect($(".question").length).toEqual(3);
      expect($(".question").last()).toHaveText("Question 3");
    });
  });

  describe("fails", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/questions/list": {errorMessage: "Failed loading questions."}}});
      $(".showQuestions").click();
    });

    it("shows error message from server", function() {
      expect($(".questions")).toHaveText("Failed loading questions.");
    });
  });
});

// Fake AJAX without DOM.

describe(".countResponseLength", function() {
  describe("succeeds", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/succeeds": {successData: "Jasmine FTW!"}}});
    });

    it("counts response length", function() {
      expect(countResponseLength({url: "/succeeds"})).toEqual(12);
    });
  });

  describe("fails", function() {
    beforeEach(function() {
      fakeAjax({urls: {"/fails": {errorMessage: "argh"}}});
    });

    it("yields given default value", function() {
      expect(countResponseLength({url: "/fails", defaultOnError: 666})).toEqual(666);
    });

    it("executes given error handler", function() {
      var errorMessage;
      function errorHandler(xhr) {
        errorMessage = xhr.responseText;
      }
      countResponseLength({url: "/fails", errorHandler: errorHandler})
      expect(errorMessage).toEqual("argh");
    });
  });
});

// Multiple related AJAX calls, some succeed, some fail.

describe("clicking question", function() {
  describe("author is not available", function() {
    beforeEach(function() {
      setFixtures('<ul class="questions"><li id="question1">q1</li><li id="question2">q2</li></ul><div class="answerContainer"></div>');
      setupAnswersBehavior();
      fakeAjax({
        urls: {
          "/answers/get?questionId=question2": {successData: loadTestData(".answer2", "fake-ajax-fixture.html")},
          "/authors/get?answerId=answer2": {errorMessage: "author data not available"},
          "/onError": {successData: "Please try again later."}
        }
      });
      $(".questions li").last().click();
    });

    it("shows answer", function() {
      expect($(".answer")).toHaveText("Answer 2");
    });

    it("shows error message instead of author details", function() {
      expect($(".author")).toHaveText("Please try again later.");
    });
  });
});

// When we only need to check the request URL.

describe(".latestAjaxUrlMatching", function() {
  beforeEach(function() {
    setupMultipleAjaxCalls();
  });

  it("sends expected params", function() {
    expect(latestAjaxUrlMatching("second")).toContain("foo=bar");
    expect(latestAjaxUrlMatching("fir")).toContain("p1=v1");
  });
});

// When response is expected to be in JSON format ($.getJSON is called in SUT).

describe("showing user info", function() {
  beforeEach(function() {
    setFixtures('<button class="showUser"/><div class="user"><div class="name"></div><div class="age"></div></div>');
    setupUserBehavior();
    fakeAjax({urls: {"/user": {successData: {name: "John", age: 30}}}});
    $('.showUser').click();
  });

  it("shows name", function() {
    expect($('.user .name')).toHaveText('John');
  });

  it("shows age", function() {
    expect($('.user .age')).toHaveText('30');
  });
});

describe("after each spec", function() {
  it("context is cleared", function() {
    expect(jasmine.FakeAjax.urls).toBeFalsy();
  });
});
