import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../domain/value-objects/role';
import { AuthenticatedUser } from './authenticated-user';
import { RolesGuard } from './roles.guard';

/** Builds a request context where the route requires `requiredRoles` and `user` is logged in. */
function setup(requiredRoles: Role[] | undefined, user?: AuthenticatedUser) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;

  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;

  return new RolesGuard(reflector).canActivate(context);
}

describe('RolesGuard', () => {
  const regularUser: AuthenticatedUser = { id: 'u1', role: 'user' };
  const admin: AuthenticatedUser = { id: 'a1', role: 'admin' };

  it('lets anyone in when the route does not require a role', () => {
    expect(setup(undefined, regularUser)).toBe(true);
  });

  it('lets in a user whose role is required', () => {
    expect(setup(['admin'], admin)).toBe(true);
  });

  it('keeps a regular user out of an admin route', () => {
    expect(setup(['admin'], regularUser)).toBe(false);
  });

  it('keeps out a request without an authenticated user', () => {
    expect(setup(['admin'], undefined)).toBe(false);
  });
});
