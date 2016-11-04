import { diffWords, diffJson } from 'diff';
import chalk from 'chalk';
import duplexer from 'duplexer';
import figures from 'figures';
import through2 from 'through2';
import parser from 'tap-parser';
import prettyMs from 'pretty-ms';
import jsondiffpatch from 'jsondiffpatch';

var argv = require('minimist')(process.argv.slice(2));

const INDENT = '  ';
const FIG_TICK = figures.tick;
const FIG_CROSS = figures.cross;

const createReporter = () => {
  const output = through2();
  const p = parser();
  const stream = duplexer(p, output);
  const startedAt = Date.now();
  let lastTestName = '';
  let failedTests = [];

  const println = (input = '', indentLevel = 0) => {
    let indent = '';

    for (let i = 0; i < indentLevel; ++i) {
      indent += INDENT;
    }

    input.split('\n').forEach(line => {
      output.push(`${indent}${line}`);
      output.push('\n');
    });
  };

  const handleTest = name => {
    if (!argv.quiet) {
      println();
    }

    println(chalk.blue(name), 1);
  };

  const handleAssertSuccess = assert => {
    if (argv.quiet) {
      return;
    }

    const name = assert.name;
    println(`${chalk.green(FIG_TICK)}  ${chalk.dim(name)}`, 2)
  };

  const printTestFailure = failure => {
    const {
      actual,
      at,
      expected,
      operator,
    } = failure;

    println(`${chalk.red('not ok')}`, 1);
    println('---', 1);
    println(`operator: ${operator}`, 2);
    println(`expected: ${chalk.red(JSON.stringify(expected))}`, 2);
    println(`actual: ${chalk.green(JSON.stringify(actual))}`, 2);
    println(`at: ${chalk.magenta(at)}`, 2);
    println('---', 1);
    println();
  };

  const handleAssertFailure = assert => {
    printTestFailure(assert.diag);

    if (argv.summary) {
      failedTests.push([lastTestName, assert.diag]);
    }
  };

  const handleComplete = result => {
    const finishedAt = Date.now();

    println();
    println(
      chalk.green(`passed: ${result.pass}  `) +
      chalk.red(`failed: ${result.fail || 0}  `) +
      chalk.white(`of ${result.count} tests  `) +
      chalk.dim(`(${prettyMs(finishedAt - startedAt)})`)
    );
    println();

    if (result.ok) {
      println(chalk.green(`All of ${result.count} tests passed!`));
    } else {
      println(chalk.red(`${result.fail || 0} of ${result.count} tests failed.`));
      stream.isFailed = true;
    }

    println();

    if (!argv.summary) {
      return;
    }

    failedTests.forEach(failure => {
      const [testName, assertDiag] = failure;
      println(chalk.red(`Test failed: ${testName}`));
      printTestFailure(assertDiag);
    });
  };

  p.on('comment', (comment) => {
    const trimmed = comment.replace('# ', '').trim();

    if (/^tests\s+[0-9]+$/.test(trimmed)) return;
    if (/^pass\s+[0-9]+$/.test(trimmed)) return;
    if (/^fail\s+[0-9]+$/.test(trimmed)) return;
    if (/^ok$/.test(trimmed)) return;

    if (argv.summary) {
      // Store the name of the test to better track test failures
      lastTestName = trimmed;
    }
    handleTest(trimmed);
  });

  p.on('assert', (assert) => {
    if (assert.ok) return handleAssertSuccess(assert);

    handleAssertFailure(assert);
  });

  p.on('complete', handleComplete);

  p.on('extra', extra => {
    println(chalk.yellow(`${extra}`.replace(/\n$/, '')), 4);
  });

  return stream;
};

export default createReporter;
