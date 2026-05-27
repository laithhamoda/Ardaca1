import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService, CreateDocumentDto, CreateDocumentVersionDto } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(@CurrentUser('organisationId') organisationId: string, @Body() dto: CreateDocumentDto) {
    return this.documentsService.createDocument(organisationId, dto);
  }

  @Post('version')
  async addVersion(@Body() dto: CreateDocumentVersionDto) {
    return this.documentsService.addVersion(dto);
  }

  @Get()
  async list(@CurrentUser('organisationId') organisationId: string) {
    return this.documentsService.listDocuments(organisationId);
  }

  @Get(':id')
  async get(@CurrentUser('organisationId') organisationId: string, @Param('id') id: string) {
    return this.documentsService.findDocument(id, organisationId);
  }
}
