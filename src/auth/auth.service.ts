import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { customError, validateEmail } from 'src/utils/util.functions';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryResponse } from 'src/cloudinary/cloudinary.response';

@Injectable()
export class AuthService {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginData: LoginUserDto, response: Response): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginData?.email },
        include: { Auth: true },
      });

      if (!user) return customError(response, "User doesn't exist");

      const isPasswordMatched = await bcrypt.compare(
        loginData?.password,
        user?.Auth?.password,
      );
      if (!isPasswordMatched) return customError(response, 'Invalid Password');

      const payload = { id: user?.id, email: user.email, type: user.Auth.type };
      const accessToken = await this.jwt.signAsync(payload);

      await this.prisma.auth.update({
        where: { userId: user?.id },
        data: {
          isLoggedIn: true,
          token: Buffer.from(accessToken, 'utf-8'),
        },
      });

      response
        .cookie(process.env.COOKIE_ACCESS_TOKEN, accessToken, {
          httpOnly: true,
          expires: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
          secure: true,
          sameSite: 'none',
        })
        .json({ success: 'User Signed In Successfully' });
    } catch (error) {
      response.json({
        error,
      });
    }
  }

  async register(
    registerData: RegisterUserDto,
    response: Response,
    profilePic?: Express.Multer.File,
  ): Promise<void> {
    try {
      const type = registerData.type;
      if (type !== 'user' && type !== 'admin')
        return customError(response, 'No such endpoint');

      const emailSearch = await this.prisma.user.findUnique({
        where: { email: registerData?.email },
      });

      if (emailSearch)
        return customError(response, 'User with provided email already exists');

      if (!validateEmail(registerData?.email))
        return customError(response, 'Please Provide a Valid Email');

      if (
        registerData?.password !== registerData?.confirmPassword ||
        registerData?.password === ''
      )
        return customError(response, 'Please provide your passwords');

      let url = '';
      let cloudinaryId = '';
      if (profilePic) {
        const response: CloudinaryResponse =
          await this.cloudinary.uploadFile(profilePic);
        url = response.secure_url;
        cloudinaryId = response.public_id;
      }

      const hashedPassword = await bcrypt.hash(registerData?.password, 10);

      const createdUser = await this.prisma.user.create({
        data: {
          email: registerData?.email,
          name: registerData?.name,
          number: registerData?.number,
          profilePic: url,
          Auth: {
            create: {
              password: hashedPassword,
              isLoggedIn: true,
              cloudinaryId,
              type: type === 'user' ? 'USER' : 'ADMIN',
            },
          },
        },
      });

      const payload = {
        id: createdUser?.id,
        email: createdUser.email,
        type: registerData?.type,
      };

      const accessToken = await this.jwt.signAsync(payload);

      await this.prisma.auth.update({
        where: {
          userId: createdUser.id,
        },
        data: {
          token: Buffer.from(accessToken, 'utf-8'),
        },
      });

      response
        .cookie(process.env.COOKIE_ACCESS_TOKEN, accessToken, {
          httpOnly: true,
          expires: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
          secure: true,
          sameSite: 'none',
        })
        .json({
          success: 'User Registered Successfully',
        });
    } catch (error) {
      response.json({
        error,
      });
    }
  }

  async signOut(email: string, response: Response): Promise<any> {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { email },
        include: { Auth: true },
      });

      if (!userExists) return customError(response, "User Doesn't exist");

      await this.prisma.auth.update({
        where: { id: userExists?.Auth?.id },
        data: { isLoggedIn: false, token: null },
      });
      response
        .clearCookie(process.env.COOKIE_ACCESS_TOKEN)
        .json({ success: 'User Signed Out Successfully' });
    } catch (error) {
      response.json({
        error,
      });
    }
  }

  async verifyToken(email: string, token: string): Promise<boolean> {
    const userExists = await this.prisma.user.findUnique({
      where: { email },
      include: { Auth: true },
    });

    if (!userExists) throw new NotFoundException('Email not found');

    if (token !== userExists?.Auth?.token.toString('utf-8')) return true;
    return false;
  }
}
