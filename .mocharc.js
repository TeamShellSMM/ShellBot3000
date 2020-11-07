'use strict';
process.env.NODE_ENV = 'test'; //for now we force the node_env to be test
module.exports = {
  'allow-uncaught': true,
  'async-only': true,
  bail: false,
  'check-leaks': true,
  delay: false,
  diff: true,
  'full-trace': false,
  global: ['TEST', 'app'],
  'inline-diffs': false,
  recursive: true,
  reporter: 'spec',
  require: 'dotenv-flow/config',
  retries: 0,
  slow: 75,
  sort: false,
  timeout: 0, // same as "no-timeout: true" or "timeout: 0"
  'trace-warnings': true, // node flags ok
  ui: 'bdd',
  watch: false,
  'watch-files': ['src/**/*.js', 'test/**/*.js'],
  'watch-ignore': ['lib/vendor'],
};
