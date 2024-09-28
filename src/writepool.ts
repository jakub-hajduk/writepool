import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputFileSync } from './output-file-sync';
import { TypedEventEmitter } from './typed-event-emitter';
import { ChangeLog } from './change-log';

export interface OutputCollectionOptions {
  outDir: string;
  dry: boolean;
  logChanges: boolean;
}

export interface OutputCollectionEventMap {
  'file:stacked': { path: string; origin: string; contents: string };
  'write:start': { index: number; total: number };
  'write:file-written': { path: string; index: number; total: number };
  'write:file-error': {
    path: string;
    index: number;
    total: number;
    error: Error;
  };
  'write:done': { index: number; total: number };
}

export class Writepool {
  static instance: Writepool;

  private emitter = new TypedEventEmitter<OutputCollectionEventMap>();
  private changeLog = new ChangeLog();
  public files: Map<string, string> = new Map();
  public origin?: string;

  public rootCollection = this;

  private options: OutputCollectionOptions = {
    outDir: dirname(fileURLToPath(import.meta.url)),
    dry: false,
    logChanges: false,
  };

  on = this.rootCollection.emitter.on;
  once = this.rootCollection.emitter.once;

  constructor(options?: Partial<OutputCollectionOptions>) {
    this.options = { ...this.options, ...options };
    this.rootCollection.on = this.rootCollection.emitter.on.bind(this);
    this.rootCollection.once = this.rootCollection.emitter.once.bind(this);
  }

  get size() {
    return this.rootCollection.files.size;
  }

  static getInstance(options?: Partial<OutputCollectionOptions>) {
    if (!Writepool.instance) {
      Writepool.instance = new Writepool(options);
    }

    return Writepool.instance;
  }

  public withOrigin(name: string) {
    const collection = new Writepool(this.options);
    collection.origin = name;
    collection.rootCollection = this.rootCollection;

    return collection;
  }

  public get(path: string): [string, string];
  public get(
    predicate: (path: string, contents: string) => boolean,
  ): [string, string];
  public get(
    pathOrPredicate: string | ((path: string, contents: string) => boolean),
  ): [string, string] {
    if (typeof pathOrPredicate === 'function') {
      for (const file of this.rootCollection.files) {
        if (pathOrPredicate(...file)) {
          return file;
        }
      }
      return;
    }

    if (this.rootCollection.files.has(pathOrPredicate)) {
      return [pathOrPredicate, this.rootCollection.files.get(pathOrPredicate)];
    }
  }

  public write(path: string, contents: string, origin: string = this.origin) {
    this.rootCollection.files.set(path, contents);
    if (this.options.logChanges) {
      this.rootCollection.changeLog.add(path, contents, origin);
    }
    this.rootCollection.emitter.emit('file:stacked', {
      path,
      origin,
      contents,
    });
  }

  public getChanges(path: string) {
    // maybe throw error ?
    if (!this.options.logChanges) return;
    return this.rootCollection.changeLog.get(path);
  }

  public *writeFilesToDisk(options?: Partial<OutputCollectionOptions>) {
    const finalOptions: OutputCollectionOptions = {
      ...this.rootCollection.options,
      ...options,
    };

    let index = 1;

    for (const [file, contents] of this.rootCollection.files) {
      const path = resolve(finalOptions.outDir, file);

      if (!this.rootCollection.options.dry) {
        outputFileSync(path, contents);
      }

      yield { path, index, total: this.rootCollection.files.size };
      index++;
    }
  }
}
