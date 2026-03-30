import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, UserRecord } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private t(key: string, args?: Record<string, unknown>): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.t(key, { args }) : key;
  }

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(this.t('auth.EMAIL_ALREADY_IN_USE'));
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    return this.buildTokenResponse(user);
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(this.t('auth.INVALID_CREDENTIALS'));
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(this.t('auth.INVALID_CREDENTIALS'));
    }

    if (user.totpEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, purpose: 'mfa' },
        {
          secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
          expiresIn: '5m',
        },
      );
      return { requiresMfa: true as const, mfaToken };
    }

    return this.buildTokenResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.AUTH_JWT_REFRESH_SECRET ?? 'change-me-refresh',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_REFRESH_TOKEN'));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException(this.t('auth.INVALID_REFRESH_TOKEN'));
    }

    return this.buildTokenResponse(user);
  }

  // --- Account deletion ---

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private async buildTokenResponse(user: UserRecord) {
    const payload = { sub: user.id, email: user.email };

    // expiresIn is typed as StringValue | number in @types/jsonwebtoken,
    // but env vars are plain string. Cast via unknown to satisfy the type.
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      expiresIn: (process.env.AUTH_JWT_ACCESS_EXPIRATION ?? '15m') as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_REFRESH_SECRET ?? 'change-me-refresh',
      expiresIn: (process.env.AUTH_JWT_REFRESH_EXPIRATION ?? '7d') as unknown as number,
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    const { passwordHash: _pw, totpSecret: _ts, recoveryCodes: _rc, ...userWithoutPassword } = fullUser!;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  // --- TOTP MFA ---

  async totpSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.totpEnabled) throw new ConflictException(this.t('auth.TOTP_ALREADY_ENABLED'));

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: process.env.APP_NAME ?? 'OAuth2App',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      uri: totp.toString(),
    };
  }

  async totpEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException(this.t('auth.TOTP_NOT_SET_UP'));
    if (user.totpEnabled) throw new ConflictException(this.t('auth.TOTP_ALREADY_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      recoveryCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        recoveryCodes: hashedCodes,
      },
    });

    return { recoveryCodes };
  }

  async totpDisable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled || !user.totpSecret)
      throw new BadRequestException(this.t('auth.TOTP_NOT_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, recoveryCodes: null },
    });

    return { message: this.t('auth.TOTP_DISABLED') };
  }

  async totpVerify(mfaToken: string, code: string) {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(mfaToken, {
        secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_EXPIRED_MFA_TOKEN'));
    }
    if (payload.purpose !== 'mfa') {
      throw new UnauthorizedException(this.t('auth.INVALID_MFA_TOKEN'));
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException(this.t('auth.INVALID_MFA_TOKEN'));
    }

    // Try TOTP code first
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });

    if (delta !== null) {
      return this.buildTokenResponse(user);
    }

    // Try recovery code
    if (user.recoveryCodes && Array.isArray(user.recoveryCodes)) {
      const hashes = user.recoveryCodes as string[];
      for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(code, hashes[i])) {
          const remaining = [...hashes];
          remaining.splice(i, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { recoveryCodes: remaining },
          });
          return this.buildTokenResponse(user);
        }
      }
    }

    throw new UnauthorizedException(this.t('auth.INVALID_TOTP_OR_RECOVERY'));
  }

  async totpRegenerateRecoveryCodes(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled || !user.totpSecret)
      throw new BadRequestException(this.t('auth.TOTP_NOT_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      recoveryCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { recoveryCodes: hashedCodes },
    });

    return { recoveryCodes };
  }
}
