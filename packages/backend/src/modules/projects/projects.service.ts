import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';
import { Team } from '../../database/entities/team.entity';

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  timeline?: Array<{ milestone: string; dueDate: string; owner: string }>;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async createProject(organisationId: string, dto: CreateProjectDto): Promise<Project> {
    const organisation = await this.organisationRepository.findOne({ where: { id: organisationId } });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    const project = this.projectRepository.create({
      ...dto,
      organisation,
      status: dto.status ?? ProjectStatus.DRAFT,
    });
    return this.projectRepository.save(project);
  }

  async updateProject(organisationId: string, id: string, data: Partial<CreateProjectDto>): Promise<Project> {
    const project = await this.findByIdAndOrg(id, organisationId);
    Object.assign(project, data);
    return this.projectRepository.save(project);
  }

  async findByIdAndOrg(id: string, organisationId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, organisation: { id: organisationId } },
      relations: ['organisation', 'members', 'approvals', 'documents'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async listByOrganisation(organisationId: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { organisation: { id: organisationId } },
      relations: ['members', 'organisation'],
      order: { updatedAt: 'DESC' },
    });
  }

  async assignTeam(projectId: string, teamId: string, organisationId: string): Promise<Project> {
    const project = await this.findByIdAndOrg(projectId, organisationId);
    const team = await this.teamRepository.findOne({ where: { id: teamId, organisation: { id: organisationId } } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    project.timeline = project.timeline || [];
    return this.projectRepository.save(project);
  }
}
