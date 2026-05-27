import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation } from '../../database/entities/organisation.entity';

export interface CreateOrganisationDto {
  name: string;
  countryCode: string;
}

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
  ) {}

  async createOrganisation(dto: CreateOrganisationDto): Promise<Organisation> {
    const organisation = this.organisationRepository.create(dto);
    return this.organisationRepository.save(organisation);
  }

  async findById(id: string): Promise<Organisation | null> {
    return this.organisationRepository.findOne({ where: { id } });
  }
}
