import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../logger';
import type { Mock } from 'vitest';

const parsed = (spy: Mock): Record<string, unknown> => {
  const arg = spy.mock.calls[0]?.[0];
  const raw = typeof arg === 'string' ? arg : '';
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`logger did not emit valid JSON: ${raw}`);
  }
};

const rawEmitted = (spy: Mock): string => {
  const arg = spy.mock.calls[0]?.[0];
  return typeof arg === 'string' ? arg : '';
};

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('routes DEBUG to console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    createLogger('feat', 'sub').debug('hi');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(parsed(spy).level).toBe('DEBUG');
  });

  it('routes INFO to console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('feat', 'sub').info('hi');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(parsed(spy).level).toBe('INFO');
  });

  it('routes WARN to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createLogger('feat', 'sub').warn('hi');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(parsed(spy).level).toBe('WARN');
  });

  it('routes ERROR to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createLogger('feat', 'sub').error('hi');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(parsed(spy).level).toBe('ERROR');
  });

  it('emits an ISO 8601 timestamp parseable by Date', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('feat', 'sub').info('hi');
    const { timestamp } = parsed(spy);
    expect(new Date(timestamp as string).toString()).not.toBe('Invalid Date');
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('includes the payload when one is passed', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('feat', 'sub').info('hi', { count: 3, label: 'x' });
    expect(parsed(spy).payload).toEqual({ count: 3, label: 'x' });
  });

  it('serializes complex/nested payloads', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('feat', 'sub').info('hi', { a: { b: { c: [1, 2, 3] }, ok: true } });
    expect(parsed(spy).payload).toEqual({ a: { b: { c: [1, 2, 3] }, ok: true } });
  });

  it('preserves featureId in the output', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('canvas', 'viewport').info('hi');
    expect(parsed(spy).featureId).toBe('canvas');
  });

  it('emits valid JSON (parse succeeds and shape is correct)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('feat', 'sub').info('hi', { k: 'v' });
    const obj = parsed(spy);
    expect(obj).toBeTypeOf('object');
    expect(obj).toHaveProperty('featureId');
    expect(obj).toHaveProperty('subModule');
    expect(obj).toHaveProperty('level');
    expect(obj).toHaveProperty('message');
    expect(obj).toHaveProperty('timestamp');
    expect(rawEmitted(spy).startsWith('{')).toBe(true);
  });

  it('supports all four levels on a single instance', () => {
    const dbg = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const inf = vi.spyOn(console, 'info').mockImplementation(() => {});
    const wrn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('feat', 'sub');
    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');
    expect(parsed(dbg).level).toBe('DEBUG');
    expect(parsed(inf).level).toBe('INFO');
    expect(parsed(wrn).level).toBe('WARN');
    expect(parsed(err).level).toBe('ERROR');
  });
});
