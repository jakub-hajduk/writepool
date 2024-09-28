import { red, green, reset } from 'colorette';
import { calcSlices } from 'fast-myers-diff';
import type {
  Change,
  ChangeContents,
  ChangeOrigin,
  ChangeTimestamp,
  DiffTuple,
  FlatDiffTuple,
} from './change-log';

const flattenDiff = (diff: Generator<DiffTuple>): FlatDiffTuple[] => {
  return Array.from(diff).flatMap(([type, contents]) => {
    return contents.map((line) => [type, line]);
  }) as FlatDiffTuple[];
};

export class FileChanges {
  private log: Change[] = [];

  constructor(public path: string) {}

  list(): {
    index: number;
    timestamp: ChangeTimestamp;
    origin: ChangeOrigin;
  }[] {
    return this.log.map((change, index) => ({
      index,
      timestamp: change.timestamp,
      origin: change.origin,
    }));
  }

  stackChange(contents: ChangeContents, origin?: ChangeOrigin) {
    const record: Change = {
      timestamp: Date.now(),
      origin: origin,
      contents: contents,
    };
    this.log.push(record);
  }

  get(index: number) {
    return this.log.at(index);
  }

  diff(prevIndex: number, nextIndex: number) {
    const prev = this.log.at(prevIndex);
    const next = this.log.at(nextIndex);

    const diff = calcSlices(
      prev.contents.split('\n'),
      next.contents.split('\n'),
    );

    const flatDiff = flattenDiff(diff);

    const flat = flatDiff.map(([type, line]) => {
      let icon = '    ';
      if (type === -1) {
        icon = ' -  ';
      }
      if (type === 1) {
        icon = ' +  ';
      }

      return `${icon}${line}`;
    });

    const formatted = flatDiff.map(([type, line]) => {
      let color = reset;
      let icon = reset('    ');
      if (type === -1) {
        color = red;
        icon = red(' -  ');
      }
      if (type === 1) {
        color = green;
        icon = green(' +  ');
      }

      return `${icon}${color(line)}`;
    });

    return {
      diff: flatDiff,
      flat,
      formatted,
      log() {
        console.log('\n', formatted.join('\n'));
      },
    };
  }
}
