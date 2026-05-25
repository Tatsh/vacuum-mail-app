import { beforeEach, describe, expect, it, vi } from 'vitest';

const attributesOfItemMock = vi.fn();
const contentsOfDirectoryMock = vi.fn();
const fileExistsMock = vi.fn();

vi.mock('jxa-lib', () => ({
  FileManager: vi.fn(function (this: Record<string, unknown>) {
    this.attributesOfItem = attributesOfItemMock;
    this.contentsOfDirectory = contentsOfDirectoryMock;
    this.fileExists = fileExistsMock;
  }),
  stdlib: {
    getenv: vi.fn(() => '/Users/tester'),
  },
}));

vi.hoisted(() => {
  global.ObjC = {
    ['import']: vi.fn(),
    unwrap: vi.fn((x: unknown) => x),
  } as unknown as typeof global.ObjC;
});

let launchedTaskTerminationStatus = 0;
const launchedTaskMock = vi.fn();
const urlWithStringMock = vi.fn((s: string) => ({ __url: s }));

global.$ = {
  NSTask: {
    launchedTaskWithExecutableURLArgumentsErrorTerminationHandler: vi.fn(
      (_url, _args, _err, handler: (task: unknown) => void) => {
        launchedTaskMock(_url, _args);
        const task = {
          get waitUntilExit() {
            handler(task);
            return undefined;
          },
          get terminationStatus() {
            return launchedTaskTerminationStatus;
          },
        };
        return task;
      },
    ),
  },
  NSURL: {
    URLWithString: urlWithStringMock,
  },
} as unknown as typeof global.$;

const activateMock = vi.fn();
const runningMock = vi.fn(() => true);
const quitMock = vi.fn();
global.Application = vi.fn(() => ({
  activate: activateMock,
  running: runningMock,
  quit: quitMock,
})) as unknown as typeof global.Application;

import main, { formatChange, getEnvelopeIndexPath, vacuumIndex } from './main';

beforeEach(() => {
  vi.clearAllMocks();
  launchedTaskTerminationStatus = 0;
  runningMock.mockReturnValue(true);
  fileExistsMock.mockReset();
});

describe('formatChange', () => {
  it('reports a decrease', () => {
    const msg = formatChange(200, 100);
    expect(msg).toContain('decrease');
    expect(msg).toContain('50.000%');
  });
  it('reports an increase', () => {
    expect(formatChange(100, 200)).toContain('increase');
  });
  it('reports no change', () => {
    expect(formatChange(100, 100)).toContain('change');
  });
});

describe('getEnvelopeIndexPath', () => {
  it('returns the V5 path when V5 exists', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['random', 'Envelope Index', 'other']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V5/MailData/Envelope Index');
  });

  it('falls back to V2 when only V2 exists', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V2/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V2/MailData/Envelope Index');
  });

  it('prefers the newest existing version when multiple exist', () => {
    fileExistsMock.mockImplementation(
      (path: string) => path.includes('/V5/') || path.includes('/V3/'),
    );
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V5/MailData/Envelope Index');
  });

  it('throws when no Mail data directory exists', () => {
    fileExistsMock.mockReturnValue(false);
    expect(() => getEnvelopeIndexPath()).toThrow(/Envelope Index/);
  });

  it('throws when the directory exists but lacks an Envelope Index', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['unrelated.sqlite']);
    expect(() => getEnvelopeIndexPath()).toThrow(/Envelope Index/);
  });
});

describe('vacuumIndex', () => {
  it('returns [before, after] sizes', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 600 });
    const [before, after] = vacuumIndex();
    expect(before).toBe(1000);
    expect(after).toBe(600);
    expect(urlWithStringMock).toHaveBeenCalledWith('file:///usr/bin/sqlite3');
    expect(launchedTaskMock).toHaveBeenCalled();
  });

  it('throws when sqlite3 exits non-zero', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    launchedTaskTerminationStatus = 1;
    expect(() => vacuumIndex()).toThrow(/Failed to vacuum/);
  });
});

describe('main', () => {
  it('quits Mail, vacuums, prints, activates, and returns 0', () => {
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 2000 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(0);
    expect(quitMock).toHaveBeenCalledWith('no');
    expect(activateMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Mail index before: 2000'));
    logSpy.mockRestore();
  });

  it('returns 1 and logs the error when vacuum fails', () => {
    fileExistsMock.mockReturnValue(false);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Envelope Index'));
    logSpy.mockRestore();
  });

  it('does not quit Mail when it is not running', () => {
    runningMock.mockReturnValueOnce(false);
    fileExistsMock.mockImplementation((path: string) => path.includes('/V5/'));
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 100 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 100 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(0);
    expect(quitMock).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
