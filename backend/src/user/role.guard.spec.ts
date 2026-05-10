import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './role.decorator';
import { RolesGuard } from './role.guard';
import { Role } from './user.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let handler: jest.Mock;
  let classRef: jest.Mock;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
    handler = jest.fn();
    classRef = jest.fn();
  });

  const createContext = (user: { role: Role } | undefined): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => classRef,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no roles metadata is defined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      expect(guard.canActivate(createContext(undefined))).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        classRef,
      ]);
    });

    it('should allow access when the user role matches a required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(createContext({ role: Role.ADMIN }))).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        classRef,
      ]);
    });

    it('should deny access when the user role does not match any required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(createContext({ role: Role.MEMBER }))).toBe(
        false,
      );
    });

    it('should allow access when one of multiple required roles matches the user role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.MEMBER]);

      expect(guard.canActivate(createContext({ role: Role.MEMBER }))).toBe(
        true,
      );
    });

    it('should throw when roles are required but the request user is missing', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(createContext(undefined))).toThrow();
    });
  });
});
