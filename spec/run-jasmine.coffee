url = "spec/fake-ajax-spec.html"
page = new WebPage()

page.onConsoleMessage = (message) ->
  console.log(message)

readResult = (connectionStatus) ->
  if connectionStatus is "success"
    page.evaluate ->
      list = document.querySelectorAll('div.runner')
      result = list[0].innerHTML.replace(/<.*?>/g, '')
      console.log((1) + ": " + result)
      if result.match(/specs, 0 failures/)
        console.log('\n========================================================')
        console.log("\nSuccess. All tests passed.")
        console.log('\n========================================================')
      else
        console.log('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.log("\nFailure. Some tests failed.")
        console.log('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  else
    console.log("Unable to access network")
  phantom.exit()

page.open encodeURI(url), (status) ->
  setTimeout (->
    readResult(status)
  ), 1000

