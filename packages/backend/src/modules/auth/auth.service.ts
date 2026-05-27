import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { UserOrganisation } from '../../database/entities/user-organisation.entity';
import { OrganisationsService } from '../organisations/organisations.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly organisationsService: OrganisationsService,
    @InjectRepository(UserOrganisation)
    private readonly userOrgRepository: Repository<UserOrganisation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(user: User) {
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['userOrganisations', 'userOrganisations.organisation'],
    });
    const organisationId = fullUser?.userOrganisations?.[0]?.organisation?.id;
    const payload = { sub: user.id, role: user.role, organisationId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.save(user);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organisationId,
      },
    };
  }

  async register(email: string, password: string, fullName: string, organisationName: string, countryCode: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const organisation = await this.organisationsService.createOrganisation({
      name: organisationName,
      countryCode,
    });

    const user = await this.usersService.createUser({
      email,
      password,
      fullName,
      role: UserRole.ORG_ADMIN,
      emailVerified: false,
    });

    const membership = this.userOrgRepository.create({
      user,
      organisation,
      role: UserRole.ORG_ADMIN,
      primary: true,
    });
    await this.userOrgRepository.save(membership);

    return this.login(user);
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    return this.login(user);
  }
}
