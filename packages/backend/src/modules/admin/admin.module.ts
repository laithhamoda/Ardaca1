import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { UserOrganisation } from '../../database/entities/user-organisation.entity';
import { Organisation } from '../../database/entities/organisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOrganisation, Organisation])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
