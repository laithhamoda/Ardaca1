import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService, CreateApprovalDto } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class ApprovalActionDto {
  action: 'approve' | 'reject';
  comment?: string;
}

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  async create(@CurrentUser('organisationId') organisationId: string, @Body() dto: CreateApprovalDto) {
    return this.approvalsService.createApproval(organisationId, dto);
  }

  @Get()
  async list(@CurrentUser('organisationId') organisationId: string) {
    return this.approvalsService.listApprovals(organisationId);
  }

  @Patch(':approvalId/steps/:stepId')
  async action(
    @CurrentUser('organisationId') organisationId: string,
    @CurrentUser('id') userId: string,
    @Param('approvalId') approvalId: string,
    @Param('stepId') stepId: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.actionStep(
      organisationId,
      approvalId,
      stepId,
      dto.action === 'approve',
      dto.comment,
      userId,
    );
  }
}
