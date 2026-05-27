import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './projects.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@CurrentUser('organisationId') organisationId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(organisationId, dto);
  }

  @Get()
  async list(@CurrentUser('organisationId') organisationId: string) {
    return this.projectsService.listByOrganisation(organisationId);
  }

  @Get(':id')
  async get(@CurrentUser('organisationId') organisationId: string, @Param('id') id: string) {
    return this.projectsService.findByIdAndOrg(id, organisationId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('organisationId') organisationId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
  ) {
    return this.projectsService.updateProject(organisationId, id, dto);
  }
}
