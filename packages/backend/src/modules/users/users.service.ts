import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { UserOrganisation } from '../../database/entities/user-organisation.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  emailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganisation)
    private readonly userOrgRepository: Repository<UserOrganisation>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      emailVerified: dto.emailVerified ?? false,
      password: await bcrypt.hash(dto.password, 12),
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async listUsersByOrg(organisationId: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userOrganisations', 'userOrg')
      .leftJoinAndSelect('userOrg.organisation', 'organisation')
      .where('organisation.id = :organisationId', { organisationId })
      .getMany();
  }

  async updateUserStatus(userId: string, disabled: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.disabled = disabled;
    return this.userRepository.save(user);
  }
}
