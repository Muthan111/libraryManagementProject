import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
export class LocalAuthGuard extends AuthGuard('local') {
    /*This guard handles local authentication using username and password.
    */
    async canActivate(context: ExecutionContext) {
        const result = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        console.log("result", result);
        return result;
    }

}