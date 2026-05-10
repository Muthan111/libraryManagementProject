import { SessionSerializer } from './session.serializer';

describe('SessionSerializer', () => {
  let serializer: SessionSerializer;

  beforeEach(() => {
    serializer = new SessionSerializer();
  });

  it('should be defined', () => {
    expect(serializer).toBeDefined();
  });

  describe('serializeUser', () => {
    it('should pass the user to done with a null error', () => {
      const user = {
        id: 7,
        email: 'reader@example.com',
      };
      const done = jest.fn();

      serializer.serializeUser(user, done);

      expect(done).toHaveBeenCalledWith(null, user);
    });
  });

  describe('deserializeUser', () => {
    it('should pass the payload to done with a null error', () => {
      const payload = {
        id: 7,
        email: 'reader@example.com',
      };
      const done = jest.fn();

      serializer.deserializeUser(payload, done);

      expect(done).toHaveBeenCalledWith(null, payload);
    });

    it('should support falsy payload values without altering them', () => {
      const done = jest.fn();

      serializer.deserializeUser(null, done);

      expect(done).toHaveBeenCalledWith(null, null);
    });
  });
});
