import { Controller, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

class InviteUserDto {
  email: string;
  fullName: string;
  role: UserRole;
}

class ChangeRoleDto {
  userId: string;
  role: UserRole;
}

class DeactivateUserDto {
  userId: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invite')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async invite(@CurrentUser('organisationId') organisationId: string, @Body() dto: InviteUserDto) {
    return this.adminService.inviteUser(organisationId, dto.email, dto.fullName, dto.role);
  }

  @Patch('role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async changeRole(@Body() dto: ChangeRoleDto) {
    return this.adminService.changeRole(dto.userId, dto.role);
  }

  @Patch('deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async deactivate(@Body() dto: DeactivateUserDto) {
    return this.adminService.deactivateUser(dto.userId);
  }
}
