import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should map JWT payload fields to the auth user shape', async () => {
      const payload = {
        sub: 42,
        email: 'librarian@example.com',
        role: 'admin',
      };

      await expect(strategy.validate(payload)).resolves.toEqual({
        userId: 42,
        email: 'librarian@example.com',
        role: 'admin',
      });
    });

    it('should return undefined values when optional payload fields are missing', async () => {
      await expect(strategy.validate({})).resolves.toEqual({
        userId: undefined,
        email: undefined,
        role: undefined,
      });
    });

    it('should ignore unrelated payload fields', async () => {
      const payload = {
        sub: 5,
        email: 'member@example.com',
        role: 'member',
        permissions: ['borrow:books'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 5,
        email: 'member@example.com',
        role: 'member',
      });
      expect(result).not.toHaveProperty('permissions');
    });
  });
});
