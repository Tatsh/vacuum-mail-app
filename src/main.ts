import { FileManager, stdlib } from 'jxa-lib';

ObjC.import('Foundation');
ObjC.import('stdlib');

export interface CommandResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Run an executable synchronously and capture its standard streams. */
export function getOutput(launchPath: string, args: string[], trim = false): CommandResult {
  const outPipe = $.NSPipe.pipe;
  const errPipe = $.NSPipe.pipe;
  const task = $.NSTask.alloc.init;
  task.launchPath = launchPath;
  task.arguments = args;
  task.standardOutput = outPipe;
  task.standardError = errPipe;
  task.launch;
  task.waitUntilExit;
  const decode = (pipe: NSPipe): string => {
    const data = pipe.fileHandleForReading.readDataToEndOfFile;
    const value = ObjC.unwrap(
      $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding),
    ) as string;
    pipe.fileHandleForReading.closeFile;
    return trim ? value.trim() : value;
  };
  return {
    status: task.terminationStatus,
    stdout: decode(outPipe),
    stderr: decode(errPipe),
  };
}

/** Returns `true` when `b < a` using AppleScript numeric string comparison. */
export function versionIsLower(a: string, b: string): boolean {
  return ObjC.wrap(a).compareOptions(b, $.NSNumericSearch) === $.NSOrderedDescending;
}

/** Resolve the path to Mail's `Envelope Index` SQLite database. */
export function getEnvelopeIndexPath(fm: FileManager = new FileManager()): string {
  const { status, stdout } = getOutput('/usr/bin/sw_vers', ['-productVersion'], true);
  if (status !== 0) {
    throw new Error('sw_vers command failed');
  }
  let mailVersion = 'V2';
  if (versionIsLower(stdout, '10.10')) mailVersion = 'V3';
  if (versionIsLower(stdout, '10.13')) mailVersion = 'V5';
  const home = ObjC.unwrap(stdlib.getenv('HOME')) as string;
  const mailDataPath = `${home}/Library/Mail/${mailVersion}/MailData`;
  for (const fn of fm.contentsOfDirectory(mailDataPath)) {
    if (/Envelope Index$/.test(fn)) {
      return `${mailDataPath}/${fn}`;
    }
  }
  throw new Error('Failed to find file matching /Envelope Index$/');
}

/** Vacuum Mail's envelope index and return `[bytesBefore, bytesAfter]`. */
export function vacuumIndex(fm: FileManager = new FileManager()): [number, number] {
  const path = getEnvelopeIndexPath(fm);
  const sizeBefore = fm.attributesOfItem(path).NSFileSize as number;
  const task = $.NSTask.launchedTaskWithLaunchPathArguments('/usr/bin/sqlite3', [path, 'vacuum']);
  task.waitUntilExit;
  if (task.terminationStatus !== 0) {
    throw new Error('Failed to vacuum; sqlite3 command failed');
  }
  const sizeAfter = fm.attributesOfItem(path).NSFileSize as number;
  return [sizeBefore, sizeAfter];
}

/** Format the human-readable summary of a vacuum result. */
export function formatChange(sizeBefore: number, sizeAfter: number): string {
  let change = 'decrease';
  if (sizeAfter > sizeBefore) change = 'increase';
  if (sizeAfter === sizeBefore) change = 'change';
  const percentChange = Math.abs(sizeAfter / sizeBefore - 1) * 100;
  return `Mail index before: ${sizeBefore}, after: ${sizeAfter} bytes, ${percentChange.toFixed(3)}% ${change}`;
}

/** Vacuum the Mail.app envelope index, returning an exit status. */
export default function main(): number {
  const mail = Application('Mail');
  if (mail.running()) {
    getOutput('/usr/bin/killall', ['Mail']);
  }
  let sizes: [number, number];
  try {
    sizes = vacuumIndex();
  } catch (e) {
    console.log(String(e));
    return 1;
  }
  console.log(formatChange(sizes[0], sizes[1]));
  mail.activate();
  return 0;
}
