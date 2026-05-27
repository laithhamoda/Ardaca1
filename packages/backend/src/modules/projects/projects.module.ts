import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';
import { ProjectMember } from '../../database/entities/project-member.entity';
import { Team } from '../../database/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Organisation, ProjectMember, Team])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
