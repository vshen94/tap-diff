'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _diff = require('diff');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _duplexer = require('duplexer');

var _duplexer2 = _interopRequireDefault(_duplexer);

var _figures = require('figures');

var _figures2 = _interopRequireDefault(_figures);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _tapParser = require('tap-parser');

var _tapParser2 = _interopRequireDefault(_tapParser);

var _prettyMs = require('pretty-ms');

var _prettyMs2 = _interopRequireDefault(_prettyMs);

var _jsondiffpatch = require('jsondiffpatch');

var _jsondiffpatch2 = _interopRequireDefault(_jsondiffpatch);

var argv = require('minimist')(process.argv.slice(2));

var INDENT = '  ';
var FIG_TICK = _figures2['default'].tick;
var FIG_CROSS = _figures2['default'].cross;

var createReporter = function createReporter() {
  var output = (0, _through22['default'])();
  var p = (0, _tapParser2['default'])();
  var stream = (0, _duplexer2['default'])(p, output);
  var startedAt = Date.now();
  var lastTestName = '';
  var failedTests = [];

  var println = function println() {
    var input = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var indentLevel = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    var indent = '';

    for (var i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    input.split('\n').forEach(function (line) {
      output.push('' + indent + line);
      output.push('\n');
    });
  };

  var handleTest = function handleTest(name) {
    if (!argv.quiet) {
      println();
    }

    println(_chalk2['default'].blue(name), 1);
  };

  var handleAssertSuccess = function handleAssertSuccess(assert) {
    if (argv.quiet) {
      return;
    }

    var name = assert.name;
    println(_chalk2['default'].green(FIG_TICK) + '  ' + _chalk2['default'].dim(name), 2);
  };

  var printTestFailure = function printTestFailure(failure) {
    if (!argv.summary) {
      return;
    }

    var actual = failure.actual;
    var at = failure.at;
    var expected = failure.expected;
    var operator = failure.operator;

    println('' + _chalk2['default'].red('not ok'), 1);
    println('---', 1);
    println('operator: ' + operator, 2);
    println('expected: ' + _chalk2['default'].red(JSON.stringify(expected)), 2);
    println('actual: ' + _chalk2['default'].green(JSON.stringify(actual)), 2);
    println('at: ' + _chalk2['default'].magenta(at), 2);
    println('---', 1);
    println();
  };

  var handleAssertFailure = function handleAssertFailure(assert) {
    printTestFailure(assert.diag);
    failedTests.push([lastTestName, assert.diag]);
  };

  var handleComplete = function handleComplete(result) {
    var finishedAt = Date.now();

    println();
    println(_chalk2['default'].green('passed: ' + result.pass + '  ') + _chalk2['default'].red('failed: ' + (result.fail || 0) + '  ') + _chalk2['default'].white('of ' + result.count + ' tests  ') + _chalk2['default'].dim('(' + (0, _prettyMs2['default'])(finishedAt - startedAt) + ')'));
    println();

    if (result.ok) {
      println(_chalk2['default'].green('All of ' + result.count + ' tests passed!'));
    } else {
      println(_chalk2['default'].red((result.fail || 0) + ' of ' + result.count + ' tests failed.'));
      stream.isFailed = true;
    }

    println();

    if (!argv.summary) {
      return;
    }

    failedTests.forEach(function (failure) {
      var _failure = _slicedToArray(failure, 2);

      var testName = _failure[0];
      var assertDiag = _failure[1];

      println(_chalk2['default'].red('Test failed: ' + testName));
      printTestFailure(assertDiag);
    });
  };

  p.on('comment', function (comment) {
    var trimmed = comment.replace('# ', '').trim();

    if (/^tests\s+[0-9]+$/.test(trimmed)) return;
    if (/^pass\s+[0-9]+$/.test(trimmed)) return;
    if (/^fail\s+[0-9]+$/.test(trimmed)) return;
    if (/^ok$/.test(trimmed)) return;

    lastTestName = trimmed;
    handleTest(trimmed);
  });

  p.on('assert', function (assert) {
    if (assert.ok) return handleAssertSuccess(assert);

    handleAssertFailure(assert);
  });

  p.on('complete', handleComplete);

  p.on('extra', function (extra) {
    println(_chalk2['default'].yellow(('' + extra).replace(/\n$/, '')), 4);
  });

  return stream;
};

exports['default'] = createReporter;
module.exports = exports['default'];