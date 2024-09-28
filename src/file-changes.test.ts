import { equal, ok, deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { FileChanges } from './file-changes';

describe('File Changes', () => {
  describe('stackChange', () => {
    it('Should stack change', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('first content');
      fileChanges.stackChange('second change');
      fileChanges.stackChange('third change');

      equal(fileChanges.list().length, 3);
    });

    it('Should add change origin if provided', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('first content', 'meta-generator');
      fileChanges.stackChange('second change', 'git-clone-template');

      equal(fileChanges.list().at(0).origin, 'meta-generator');
      equal(fileChanges.list().at(1).origin, 'git-clone-template');
    });
  });

  describe('list', () => {
    it('Should return an array of changes', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('first content');
      fileChanges.stackChange('second change');

      const list = fileChanges.list();

      equal(Array.isArray(list), true);
    });

    it('List item should contain index, origin and timestamp', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('content');

      const list = fileChanges.list();
      const listItem = list[0];

      ok('index' in listItem);
      ok('origin' in listItem);
      ok('timestamp' in listItem);
    });
  });

  describe('get', () => {
    it('Should return change record for a file by providing index of a change.', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('first');
      fileChanges.stackChange('second');
      fileChanges.stackChange('third');
      fileChanges.stackChange('fourth');

      const change = fileChanges.get(1);

      equal(change.contents, 'second');
    });

    it('Should accept negative indexes', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('first');
      fileChanges.stackChange('second');
      fileChanges.stackChange('third');
      fileChanges.stackChange('fourth');

      const change = fileChanges.get(-1);

      equal(change.contents, 'fourth');
    });
  });

  describe('diff', () => {
    it('Should show diff changes', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('unchanged line\nunchanged line\nunchanged line');
      fileChanges.stackChange(
        'unchanged line\nchanged line\nunchanged line\nadded line',
      );

      const change = fileChanges.diff(0, 1);

      deepEqual(change.flat, [
        '    unchanged line',
        ' +  changed line',
        '    unchanged line',
        ' -  unchanged line',
        ' +  added line',
      ]);
    });

    it('Should format colors', () => {
      const fileChanges = new FileChanges('test.txt');

      fileChanges.stackChange('unchanged line\nunchanged line\nunchanged line');
      fileChanges.stackChange(
        'unchanged line\nchanged line\nunchanged line\nadded line',
      );

      const change = fileChanges.diff(0, 1);

      ok(change.formatted.join().includes('\x1B[0m'));
      ok(change.formatted.join().includes('\x1B[31m '));
      ok(change.formatted.join().includes('\x1B[32m'));
    });
  });
});
