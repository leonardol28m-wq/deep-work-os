import { describe, it, expect } from 'vitest';
import { BLOCKED_DOMAINS_NORMAL, BLOCKED_DOMAINS_EXTREME } from '../src/background/blocker';
import { isBlockedDomain } from '../src/shared/utils/time';

describe('BLOCKED_DOMAINS_NORMAL', () => {
  it('contains all major distracting platforms', () => {
    for (const d of ['youtube.com','instagram.com','facebook.com','tiktok.com','twitch.tv','reddit.com']) {
      expect(BLOCKED_DOMAINS_NORMAL).toContain(d);
    }
  });
  it('has at least 8 domains', () => { expect(BLOCKED_DOMAINS_NORMAL.length).toBeGreaterThanOrEqual(8); });
  it('does not contain work tools', () => {
    expect(BLOCKED_DOMAINS_NORMAL).not.toContain('github.com');
    expect(BLOCKED_DOMAINS_NORMAL).not.toContain('notion.so');
  });
});

describe('BLOCKED_DOMAINS_EXTREME', () => {
  it('is a superset of normal domains', () => {
    for (const d of BLOCKED_DOMAINS_NORMAL) expect(BLOCKED_DOMAINS_EXTREME).toContain(d);
  });
  it('contains additional platforms vs normal mode', () => {
    expect(BLOCKED_DOMAINS_EXTREME.length).toBeGreaterThan(BLOCKED_DOMAINS_NORMAL.length);
  });
  it('includes netflix and discord', () => {
    expect(BLOCKED_DOMAINS_EXTREME).toContain('netflix.com');
    expect(BLOCKED_DOMAINS_EXTREME).toContain('discord.com');
  });
});

describe('URL blocking integration', () => {
  it('blocks YouTube URLs', () => { expect(isBlockedDomain('https://www.youtube.com/watch?v=abc', BLOCKED_DOMAINS_NORMAL)).toBe(true); });
  it('blocks Instagram', () => { expect(isBlockedDomain('https://instagram.com/stories', BLOCKED_DOMAINS_NORMAL)).toBe(true); });
  it('blocks TikTok', () => { expect(isBlockedDomain('https://www.tiktok.com/@user', BLOCKED_DOMAINS_NORMAL)).toBe(true); });
  it('blocks Reddit', () => { expect(isBlockedDomain('https://reddit.com/r/productivity', BLOCKED_DOMAINS_NORMAL)).toBe(true); });
  it('blocks X/Twitter', () => {
    expect(isBlockedDomain('https://x.com/user', BLOCKED_DOMAINS_NORMAL)).toBe(true);
    expect(isBlockedDomain('https://twitter.com/user', BLOCKED_DOMAINS_NORMAL)).toBe(true);
  });
  it('does NOT block GitHub', () => { expect(isBlockedDomain('https://github.com/user/repo', BLOCKED_DOMAINS_NORMAL)).toBe(false); });
  it('does NOT block StackOverflow', () => { expect(isBlockedDomain('https://stackoverflow.com/q/1234', BLOCKED_DOMAINS_NORMAL)).toBe(false); });
  it('does NOT block localhost', () => { expect(isBlockedDomain('http://localhost:3000', BLOCKED_DOMAINS_NORMAL)).toBe(false); });
  it('blocks Netflix only in extreme mode', () => {
    expect(isBlockedDomain('https://netflix.com', BLOCKED_DOMAINS_NORMAL)).toBe(false);
    expect(isBlockedDomain('https://netflix.com', BLOCKED_DOMAINS_EXTREME)).toBe(true);
  });
  it('blocks Discord only in extreme mode', () => {
    expect(isBlockedDomain('https://discord.com', BLOCKED_DOMAINS_NORMAL)).toBe(false);
    expect(isBlockedDomain('https://discord.com', BLOCKED_DOMAINS_EXTREME)).toBe(true);
  });
});
