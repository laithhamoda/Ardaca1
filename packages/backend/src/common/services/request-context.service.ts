import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestContextService {
  private organisationId: string | null = null;

  setOrganisationId(organisationId: string) {
    this.organisationId = organisationId;
  }

  getOrganisationId(): string | null {
    return this.organisationId;
  }
}
