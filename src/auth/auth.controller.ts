import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request as ExpressRequest, Response } from 'express';
import { SkipAuth } from './skip.auth';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginUserDto, @Res() response: Response) {
    return this.authService.login(loginDto, response);
  }

  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @Post('register')
  @UseInterceptors(FileInterceptor('profilePic'))
  register(
    @Body() registerDto: RegisterUserDto,
    @Res() response: Response,
    @UploadedFile() profilePic?: Express.Multer.File,
  ) {
    return this.authService.register(registerDto, response, profilePic);
  }

  @HttpCode(HttpStatus.OK)
  @Get('signout')
  signOut(@Request() req: ExpressRequest, @Res() response: Response) {
    return this.authService.signOut(req['user']['email'], response);
  }
}
