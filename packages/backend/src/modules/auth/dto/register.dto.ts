import { IsEmail, IsString, MinLength, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(3)
  fullName: string;

  @IsString()
  @MinLength(2)
  organisationName: string;

  @IsString()
  @Length(2, 3)
  countryCode: string;
}
