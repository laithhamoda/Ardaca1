import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly requestContext: RequestContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.organisationId) {
      throw new BadRequestException('Tenant context is missing');
    }
    this.requestContext.setOrganisationId(user.organisationId);
    return true;
  }
}
