import { beforeEach, describe, expect, it, vi } from 'vitest';

const attributesOfItemMock = vi.fn();
const contentsOfDirectoryMock = vi.fn();

vi.mock('jxa-lib', () => ({
  FileManager: vi.fn(function (this: Record<string, unknown>) {
    this.attributesOfItem = attributesOfItemMock;
    this.contentsOfDirectory = contentsOfDirectoryMock;
  }),
  stdlib: {
    getenv: vi.fn(() => '/Users/tester'),
  },
}));

vi.hoisted(() => {
  global.ObjC = {
    ['import']: vi.fn(),
    unwrap: vi.fn((x: unknown) => x),
    wrap: vi.fn((x: unknown) => ({
      compareOptions: (other: string, _: unknown) => {
        const a = String(x);
        return a > other ? 1 : a < other ? -1 : 0;
      },
    })),
  } as unknown as typeof global.ObjC;
});

const launchMock = vi.fn();
const waitUntilExitMock = vi.fn();
const closeFileMock = vi.fn();

let terminationStatus = 0;
let pendingStdout = '10.15';
let pendingStderr = '';
let launchedTaskTerminationStatus = 0;
let pipeIndex = 0;

const buildPipe = (text: string) => ({
  fileHandleForReading: {
    readDataToEndOfFile: { __text: text },
    closeFile: closeFileMock,
  },
});

global.$ = {
  NSPipe: {
    get pipe() {
      const text = pipeIndex % 2 === 0 ? pendingStdout : pendingStderr;
      pipeIndex += 1;
      return buildPipe(text);
    },
  },
  NSTask: {
    alloc: {
      get init() {
        return {
          launchPath: '',
          arguments: [] as string[],
          standardOutput: null,
          standardError: null,
          get launch() {
            launchMock();
            return undefined;
          },
          get waitUntilExit() {
            waitUntilExitMock();
            return undefined;
          },
          get terminationStatus() {
            return terminationStatus;
          },
        };
      },
    },
    launchedTaskWithLaunchPathArguments: vi.fn(() => ({
      get waitUntilExit() {
        return undefined;
      },
      get terminationStatus() {
        return launchedTaskTerminationStatus;
      },
    })),
  },
  NSString: {
    alloc: {
      initWithDataEncoding: vi.fn((data: { __text?: string } | undefined) => data?.__text ?? ''),
    },
  },
  NSUTF8StringEncoding: 4,
  NSNumericSearch: 64,
  NSOrderedDescending: 1,
  exit: vi.fn(),
} as unknown as typeof global.$;

const activateMock = vi.fn();
const runningMock = vi.fn(() => true);
global.Application = vi.fn(() => ({
  activate: activateMock,
  running: runningMock,
})) as unknown as typeof global.Application;

import main, {
  formatChange,
  getEnvelopeIndexPath,
  getOutput,
  vacuumIndex,
  versionIsLower,
} from './main';

beforeEach(() => {
  vi.clearAllMocks();
  terminationStatus = 0;
  pendingStdout = '10.15';
  pendingStderr = '';
  launchedTaskTerminationStatus = 0;
  pipeIndex = 0;
  runningMock.mockReturnValue(true);
});

describe('getOutput', () => {
  it('captures stdout and stderr and trims when requested', () => {
    pendingStdout = '  hello\n';
    pendingStderr = 'oops\n';
    const result = getOutput('/bin/echo', ['x'], true);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('hello');
    expect(result.stderr).toBe('oops');
    expect(launchMock).toHaveBeenCalled();
    expect(waitUntilExitMock).toHaveBeenCalled();
  });

  it('does not trim when trim flag is false', () => {
    pendingStdout = '  hello\n';
    const result = getOutput('/bin/echo', ['x']);
    expect(result.stdout).toBe('  hello\n');
  });
});

describe('versionIsLower', () => {
  it('returns true when b < a', () => {
    expect(versionIsLower('10.15', '10.10')).toBe(true);
  });
  it('returns false when b >= a', () => {
    expect(versionIsLower('10.10', '10.15')).toBe(false);
  });
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
  it('finds the Envelope Index file under MailData (V5 on modern macOS)', () => {
    contentsOfDirectoryMock.mockReturnValueOnce(['random', 'Envelope Index', 'other']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V5/MailData/Envelope Index');
  });

  it('uses V3 when the macOS version is between 10.10 and 10.13', () => {
    pendingStdout = '10.11';
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V3/MailData/Envelope Index');
  });

  it('uses V2 when the macOS version is older than 10.10', () => {
    pendingStdout = '10.09';
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    expect(getEnvelopeIndexPath()).toBe('/Users/tester/Library/Mail/V2/MailData/Envelope Index');
  });

  it('throws when sw_vers fails', () => {
    terminationStatus = 7;
    expect(() => getEnvelopeIndexPath()).toThrow('sw_vers command failed');
  });

  it('throws when Envelope Index is missing', () => {
    contentsOfDirectoryMock.mockReturnValueOnce(['a', 'b']);
    expect(() => getEnvelopeIndexPath()).toThrow(/Envelope Index/);
  });
});

describe('vacuumIndex', () => {
  it('returns [before, after] sizes', () => {
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 600 });
    const [before, after] = vacuumIndex();
    expect(before).toBe(1000);
    expect(after).toBe(600);
  });

  it('throws when sqlite3 exits non-zero', () => {
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    launchedTaskTerminationStatus = 1;
    expect(() => vacuumIndex()).toThrow(/Failed to vacuum/);
  });
});

describe('main', () => {
  it('vacuums, prints, activates, and returns 0', () => {
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 2000 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 1000 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(0);
    expect(activateMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Mail index before: 2000'));
    logSpy.mockRestore();
  });

  it('returns 1 and logs the error when vacuum fails', () => {
    contentsOfDirectoryMock.mockReturnValueOnce([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Envelope Index'));
    logSpy.mockRestore();
  });

  it('does not killall Mail when it is not running', () => {
    runningMock.mockReturnValueOnce(false);
    contentsOfDirectoryMock.mockReturnValueOnce(['Envelope Index']);
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 100 });
    attributesOfItemMock.mockReturnValueOnce({ NSFileSize: 100 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main()).toBe(0);
    logSpy.mockRestore();
  });
});
