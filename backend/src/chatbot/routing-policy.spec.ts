import { RoutingPolicy } from './routing-policy';

describe('RoutingPolicy', () => {
  let rp: RoutingPolicy;

  beforeEach(() => {
    rp = new RoutingPolicy();
  });

  it('detects tool queries', () => {
    expect(rp.isToolQuery('Find book by ISBN 123')).toBe(true);
    expect(rp.isToolQuery('Do you have books by Robert C. Martin?')).toBe(true);
  });

  it('returns false for non-tool queries', () => {
    expect(rp.isToolQuery('Tell me about libraries')).toBe(false);
    expect(rp.isToolQuery('How are you today?')).toBe(false);
  });
});
