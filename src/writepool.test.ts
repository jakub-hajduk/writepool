import { equal, notEqual, ok } from 'node:assert';
import { it, describe } from 'node:test';
import { FileChanges } from './file-changes';
import { Writepool } from './writepool';

describe('Writepool', () => {
  describe('instantiate', () => {
    it('Should instantiate as different instances', () => {
      const pool1 = new Writepool();
      const pool2 = new Writepool();

      notEqual(pool1, pool2);
    });

    it('Should be singleton instance if using getInstance()', () => {
      const pool1 = Writepool.getInstance();
      const pool2 = Writepool.getInstance();

      equal(pool1, pool2);
    });

    it('Should have default origin set if instantiated with withOrigin()', () => {
      const writepool = new Writepool();
      const metaGeneratorWritepool = writepool.withOrigin('meta-generator');

      equal(metaGeneratorWritepool.origin, 'meta-generator');
    });
  });

  describe('write', () => {
    it('Should stack file', () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'first file');
      writepool.write('test2.txt', 'second file');
      writepool.write('test3.txt', 'third file');

      equal(writepool.size, 3);
    });

    it('Should overwrite file if the same path is provided', () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'first version');
      writepool.write('test.txt', 'second version');

      const [_file, contents] = writepool.get('test.txt');
      equal(contents, 'second version');
    });
  });

  describe('get', () => {
    it('Should get file with path', () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'first file');
      writepool.write('test2.txt', 'second file');
      writepool.write('test3.txt', 'third file');

      const [_path, contents] = writepool.get('test2.txt');
      equal(contents, 'second file');
    });

    it('Should get file with predicate function that looks in paths', () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'first file');
      writepool.write('test2.txt', 'second file');
      writepool.write('test3.txt', 'third file');

      const [_path, contents] = writepool.get((p) => p === 'test2.txt');
      equal(contents, 'second file');
    });

    it('Should get file with predicate function that looks in file content', () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'first file');
      writepool.write('test2.txt', 'second file');
      writepool.write('test3.txt', 'third file');

      const [_path, contents] = writepool.get((_p, c) => c.includes('second'));
      equal(contents, 'second file');
    });
  });

  describe('getChanges()', () => {
    it(`Changes logging shouldn't be available if Writepool is instantiated without {logChanges: true}.`, () => {
      const writepool = new Writepool({ dry: true });
      writepool.write('test.txt', 'test content');

      const changes = writepool.getChanges('test.txt');

      equal(changes, undefined);
    });

    it('Should return FileChanges instance', () => {
      const writepool = new Writepool({ dry: true, logChanges: true });
      writepool.write('test.txt', 'test content');

      const changes = writepool.getChanges('test.txt');

      ok(changes instanceof FileChanges);
    });
  });

  describe('writeFilesToDisk async genereator', () => {
    it('generator should work', async () => {
      const writepool = new Writepool({ dry: true });

      writepool.write('test.txt', 'test content');
      writepool.write('test2.txt', 'test content');

      for (const file of writepool.writeFilesToDisk()) {
        equal(!!file, true);
      }
    });

    it('asd', () => {
      const writepool = new Writepool({ dry: true });

      writepool.write('test.txt', 'test content');
      writepool.write('test2.txt', 'test content');
      writepool.write('test3.txt', 'test content');

      writepool.writeFilesToDisk();
    });

    it('Should yield as many times as there are files', async () => {
      const writepool = new Writepool({ dry: true });

      writepool.write('test.txt', 'test content');
      writepool.write('test2.txt', 'test content');
      writepool.write('test3.txt', 'test content');

      let i = 0;
      for (const _file of writepool.writeFilesToDisk()) {
        i++;
      }

      equal(i, 3);
    });
  });
});
