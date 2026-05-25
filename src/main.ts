import { FileManager, stdlib } from 'jxa-lib';

ObjC.import('Foundation');
ObjC.import('stdlib');

const MAIL_DATA_VERSIONS = ['V11', 'V10', 'V9', 'V8', 'V7', 'V6', 'V5', 'V4', 'V3', 'V2'] as const;

/** Resolve the path to Mail's `Envelope Index` SQLite database by probing the per-version
 * `~/Library/Mail/V<n>/MailData/` folders for the file rather than version-sniffing macOS. */
export function getEnvelopeIndexPath(fm: FileManager = new FileManager()): string {
  const home = ObjC.unwrap(stdlib.getenv('HOME')) as string;
  for (const version of MAIL_DATA_VERSIONS) {
    const dir = `${home}/Library/Mail/${version}/MailData`;
    if (!fm.fileExists(dir)) continue;
    for (const fn of fm.contentsOfDirectory(dir)) {
      if (/Envelope Index$/.test(fn)) {
        return `${dir}/${fn}`;
      }
    }
  }
  throw new Error('Failed to find an Envelope Index file under ~/Library/Mail/V*/MailData');
}

/** Vacuum Mail's envelope index and return `[bytesBefore, bytesAfter]`. */
export function vacuumIndex(fm: FileManager = new FileManager()): [number, number] {
  const path = getEnvelopeIndexPath(fm);
  const sizeBefore = fm.attributesOfItem(path).NSFileSize as number;
  const task = $.NSTask.launchedTaskWithExecutableURLArgumentsErrorTerminationHandler(
    $.NSURL.URLWithString('file:///usr/bin/sqlite3'),
    [path, 'vacuum'] as unknown as JXArray<string>,
    null,
    () => {},
  );
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
    mail.quit('no');
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
