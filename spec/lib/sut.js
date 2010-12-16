var sut = (function($) {
  function setupQuestionsBehavior() {
    $(".showQuestions").live("click", function() {
      $.ajax({
        url: "/questions/list",
        success: function(questions) {
          $(".questions").html(questions)
        },
        error: function(xhr) {
          $(".questions").text(xhr.responseText)
        }
      })
    })
  }

  function setupAnswersBehavior() {
    $(".questions li").live("click", function() {
      var question = $(this)
      $.ajax({
        url: "/answers/get?questionId=" + question.attr("id"),
        success: function(answer) {
          $(".answerContainer").html(answer)
          $.ajax({
            url: "/authors/get?answerId=" + $(answer).attr("id"),
            error: function(xhr) {
              $.get("/onError", function(message) {
                $(".answerContainer .author").text(message)
              })
            }
          })
        }
      })
    })
  }

  function countResponseLength(params) {
    var length
    $.ajax({
      url: params.url,
      success: function(data) {
        length = data.length
      },
      error: function(xhr) {
        length = params.defaultOnError
        if (params.errorHandler) {
          params.errorHandler(xhr)
        }
      }
    })
    return length
  }

  function setupMultipleAjaxCalls() {
    $.ajax({
      url: "/first",
      data: {
        "param1": "value1",
        "param2": "value2"
      }
    })
    $.get("/second?param=" + $.URLEncode(' <foo> "bar+&?#'))
    $.get("/third", function(data){})
  }

  function setupUserBehavior() {
    $('.showUser').click(function() {
      $.getJSON("/user", function(user) {
        $('.user .name').text(user.name)
        $('.user .age').text(user.age)
      })
    })
  }

  return {
    setupQuestionsBehavior: setupQuestionsBehavior,
    setupAnswersBehavior: setupAnswersBehavior,
    countResponseLength: countResponseLength,
    setupMultipleAjaxCalls: setupMultipleAjaxCalls,
    setupUserBehavior: setupUserBehavior
  }
})(jQuery)
