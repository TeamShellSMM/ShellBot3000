'use strict';
process.env.NODE_ENV='test'; //for now we force the node_env to be test
module.exports = {
  'allow-uncaught': true,
  'async-only': true,
  bail: false,
  'check-leaks': true,
  delay: false,
  diff: true,
  'full-trace': false,
  global: ['TEST','app'],
  'inline-diffs': false,
  recursive: true,
  reporter: 'spec',
  //require: 'test/bootstrap.js'
  retries: 0,
  slow: 75,
  sort: false,
  // spec: 'test/**/*.spec.js' // the positional arguments!
  timeout: 10000, // same as "no-timeout: true" or "timeout: 0"
  'trace-warnings': true, // node flags ok
  ui: 'bdd',
  watch: false,
  'watch-files':['lib/**/*.js','test/**/*.js'],
  'watch-ignore':['lib/vendor'],
};