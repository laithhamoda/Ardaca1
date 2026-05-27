import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserOrganisation, Organisation, UserRole } from '@/database/entities';
import { RegisterDto, LoginDto, RefreshTokenDto, PasswordResetRequestDto, PasswordResetDto, VerifyEmailDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organisation)
    private organisationsRepository: Repository<Organisation>,
    @InjectRepository(UserOrganisation)
    private userOrganisationsRepository: Repository<UserOrganisation>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, organisationName, country, language } = registerDto;

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      language: language || 'en',
    });
    await this.usersRepository.save(user);

    // Create organisation
    const orgCode = `ORG-${uuid().slice(0, 8).toUpperCase()}`;
    const organisation = this.organisationsRepository.create({
      name: organisationName,
      code: orgCode,
      country: country || 'AE',
      defaultLanguage: language || 'en',
    });
    await this.organisationsRepository.save(organisation);

    // Assign user as ORG_ADMIN
    const userOrg = this.userOrganisationsRepository.create({
      userId: user.id,
      organisationId: organisation.id,
      role: UserRole.ORG_ADMIN,
    });
    await this.userOrganisationsRepository.save(userOrg);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, organisation.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organisations: [
          {
            id: organisation.id,
            name: organisation.name,
            role: UserRole.ORG_ADMIN,
          },
        ],
      },
    };
  }

  async login(loginDto: LoginDto, organisationId?: string) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['userOrganisations', 'userOrganisations.organisation'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Log the login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    // Determine organisation for token
    let selectedOrgId = organisationId;
    if (!selectedOrgId) {
      const userOrg = user.userOrganisations?.[0];
      selectedOrgId = userOrg?.organisationId;
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, selectedOrgId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organisations: user.userOrganisations.map((uo) => ({
          id: uo.organisation.id,
          name: uo.organisation.name,
          role: uo.role,
        })),
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        payload.sub,
        payload.organisationId,
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link will be sent' };
    }

    const resetToken = uuid();
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await this.usersRepository.save(user);

    // TODO: Send email with reset link
    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(dto: PasswordResetDto) {
    const user = await this.usersRepository.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await this.usersRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: dto.token },
    });

    if (!user || !user.emailVerificationTokenExpiry || user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await this.usersRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async generateTokens(userId: string, organisationId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, organisationId },
      { expiresIn: this.configService.get('JWT_EXPIRY') || '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, organisationId },
      { expiresIn: '7d', secret: this.configService.get('JWT_REFRESH_SECRET') },
    );

    return { accessToken, refreshToken };
  }
}
