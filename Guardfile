# Execute `guard` server to watch for file changes to trigger
# automatic coffeescript compilation.

guard 'coffeescript', :output => 'js' do
  watch(/^src\/(.*).js.coffee/)
end

guard 'coffeescript', :output => 'debug' do
  watch(/^debug\/(.*).js.coffee/)
end

guard 'livereload', :apply_js_live => false do
  watch(/^.+\.html$/)
  watch(/^.+\.css$/)
  watch(/^.+\.js$/)
end
