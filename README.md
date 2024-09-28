# writepool 

Writepool is a Node.js package that collects files before writing to disk, allowing you to track changes, manage output, and run dry-runs without committing. Ideal for applications needing precise and controlled file output management.

# Guides

```typescript
  const writepool = new Writepool() // For regular instance
  // OR
  const writepool = Writepool.getInstance() // For singleton instance
  // OR
  const writepoolWithPredefinedOrigin = writepool.withOrigin('meta-content-generator')
```
## Writing Files with Writepool

### Adding New Files

The `files.write` method accessible from the context doesn't write the file to the disk immediately. Instead, it stacks the new content for the file path, enabling you to modify files later or debug the file changes before they are written.

```typescript
writepool.write('./created-at.txt', time.datetime)
```

It's a good practice to provide the origin of the change. With this name, all changes are easier to track. You can specify a custom name.

```typescript
writepool.write('./README.md', contents, 'readme-md-generator');
```
## Editing Stacked Files

You can edit a file that has already been created using the `write` method.

```typescript
const [versionPath, versionContents] = writepool.get((path) => path.includes('version.json'));
 
const parsedVersionContents = JSON.parse(versionContents);
parsedVersionContents.version = 'v.2.0.0';
// writing the same file path overwrites the file contents
files.write(versionPath, JSON.stringify(parsedVersionContents), 'version-bumper');
```

## Debugging Changes

You can also track the changes made to a file. In order to make it possible, you need to instantiate Writepool with `{ logChanges: true }` option.

```typescript
const writepool = new Writepool({logChanges: true})
const changes = writepool.getChanges('./package.json');
console.table(changes.list())
```
Or see the specific version of the file:

```typescript
const writepool = new Writepool({logChanges: true})
const changes = writepool.getChanges('./package.json');
changes.get(3)
// OR using negative indexses for getting last changes:
changes.get(-1)
```

Eventually you can compare some changes with diff:

```typescript
const writepool = new Writepool({logChanges: true})
const changes = writepool.getChanges('./package.json');
changes.diff(-1, -2); // Prints colored diff in the console
```

## Writing files to disk

You can write all files to disk using `writeFilesToDisk()` method.

```typescript
writepool.writeFilesToDisk()
```

Or you can  do something on each file being written. When using as an generator, with each written file, an object with following properties is yielded: 
- `path` - path of a file
- `index` - current file index
- `total` - total files to be written

```typescript
for (const data of writepool.writeFilesToDisk()) {
  console.log(`File ${data.path} successfully written. (${data.index} / ${data.total} Done.)`)
}
```
