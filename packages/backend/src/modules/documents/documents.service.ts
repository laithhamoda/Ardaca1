import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../database/entities/document.entity';
import { DocumentVersion } from '../../database/entities/document-version.entity';
import { Project } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';

export interface CreateDocumentDto {
  title: string;
  category: string;
  projectId: string;
  confidential?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateDocumentVersionDto {
  documentId: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  version: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepository: Repository<DocumentVersion>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
  ) {}

  async createDocument(organisationId: string, dto: CreateDocumentDto): Promise<Document> {
    const project = await this.projectRepository.findOne({ where: { id: dto.projectId, organisation: { id: organisationId } } });
    const organisation = await this.organisationRepository.findOne({ where: { id: organisationId } });
    if (!project || !organisation) {
      throw new NotFoundException('Project or organisation not found');
    }
    const document = this.documentRepository.create({
      title: dto.title,
      category: dto.category,
      project,
      organisation,
      confidential: dto.confidential ?? false,
      metadata: dto.metadata || {},
    });
    return this.documentRepository.save(document);
  }

  async addVersion(dto: CreateDocumentVersionDto): Promise<DocumentVersion> {
    const document = await this.documentRepository.findOne({ where: { id: dto.documentId }, relations: ['organisation'] });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    const version = this.versionRepository.create({
      document,
      version: dto.version,
      filename: dto.filename,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType,
      size: dto.size,
    });
    return this.versionRepository.save(version);
  }

  async listDocuments(organisationId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { organisation: { id: organisationId } },
      relations: ['versions', 'project'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findDocument(id: string, organisationId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id, organisation: { id: organisationId } },
      relations: ['versions', 'project'],
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }
}
