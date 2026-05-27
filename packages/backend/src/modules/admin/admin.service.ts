import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { Organisation } from '../../database/entities/organisation.entity';
import { UserOrganisation } from '../../database/entities/user-organisation.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganisation)
    private readonly userOrgRepository: Repository<UserOrganisation>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
  ) {}

  async inviteUser(organisationId: string, email: string, fullName: string, role: UserRole) {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const user = this.userRepository.create({
      email,
      fullName,
      role,
      password: await bcrypt.hash(Math.random().toString(36).slice(2, 12), 12),
      emailVerified: false,
    });
    const saved = await this.userRepository.save(user);
    const organisation = await this.organisationRepository.findOne({ where: { id: organisationId } });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    await this.userOrgRepository.save(
      this.userOrgRepository.create({
        user: saved,
        organisation,
        role,
        primary: false,
      }),
    );
    return saved;
  }

  async changeRole(userId: string, role: UserRole) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  async deactivateUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.disabled = true;
    return this.userRepository.save(user);
  }
}
