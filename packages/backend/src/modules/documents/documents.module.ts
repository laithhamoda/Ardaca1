import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from '../../database/entities/document.entity';
import { DocumentVersion } from '../../database/entities/document-version.entity';
import { Project } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentVersion, Project, Organisation])],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
