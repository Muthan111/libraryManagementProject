import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  /*This guard checks if a user is authenticated before allowing access to certain routes.
   */
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return request.isAuthenticated();
  }
}
