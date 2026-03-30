import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { TotpCodeDto } from './dto/totp-code.dto';
import { TotpVerifyDto } from './dto/totp-verify.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address using a verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent if applicable' })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if applicable' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken, refreshToken, and user profile',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Returns a new accessToken and refreshToken',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: { user: { userId: string; email: string } }) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email address (resets verification and sends new verification email)' })
  @ApiResponse({ status: 200, description: 'Email updated, verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateEmail(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateEmailDto,
  ) {
    return this.authService.updateEmail(req.user.userId, dto.email);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the currently authenticated user and all associated data' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: { user: { userId: string } }) {
    await this.authService.deleteAccount(req.user.userId);
  }

  // ── TOTP MFA ──

  @Post('totp/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate TOTP secret and QR code URI' })
  @ApiResponse({ status: 200, description: 'Returns secret and otpauth URI' })
  @ApiResponse({ status: 409, description: 'TOTP already enabled' })
  @HttpCode(HttpStatus.OK)
  async totpSetup(@Request() req: { user: { userId: string } }) {
    return this.authService.totpSetup(req.user.userId);
  }

  @Post('totp/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA. Returns recovery codes.' })
  @ApiResponse({ status: 200, description: 'TOTP enabled, recovery codes returned' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  @HttpCode(HttpStatus.OK)
  async totpEnable(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpEnable(req.user.userId, dto.code);
  }

  @Post('totp/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable TOTP MFA' })
  @ApiResponse({ status: 200, description: 'TOTP disabled' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code or TOTP not enabled' })
  @HttpCode(HttpStatus.OK)
  async totpDisable(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpDisable(req.user.userId, dto.code);
  }

  @Post('totp/verify')
  @ApiOperation({ summary: 'Verify TOTP or recovery code during sign-in MFA challenge' })
  @ApiResponse({ status: 200, description: 'Returns accessToken, refreshToken, and user' })
  @ApiResponse({ status: 401, description: 'Invalid MFA token or code' })
  @HttpCode(HttpStatus.OK)
  async totpVerify(@Body() dto: TotpVerifyDto) {
    return this.authService.totpVerify(dto.mfaToken, dto.code);
  }

  @Post('totp/recovery-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate recovery codes (requires valid TOTP code)' })
  @ApiResponse({ status: 200, description: 'New recovery codes returned' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code or TOTP not enabled' })
  @HttpCode(HttpStatus.OK)
  async totpRegenerateRecoveryCodes(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpRegenerateRecoveryCodes(req.user.userId, dto.code);
  }
}
