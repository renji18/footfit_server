import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { CloudinaryResponse } from 'src/cloudinary/cloudinary.response';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma.service';
import {
  customError,
  customUnauthorizedError,
  validateEmail,
} from 'src/utils/util.functions';
import * as bcrypt from 'bcryptjs';
import { RegisterVendorDto } from './dto/vendor.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async checkAdmin(email: string): Promise<boolean> {
    const admin = await this.prisma.user.findUnique({
      where: { email, Auth: { type: 'ADMIN' } },
    });

    if (!admin) return false;
    return true;
  }

  async getAllUsers(email: string, response: Response): Promise<void> {
    try {
      const admin = await this.checkAdmin(email);

      if (!admin) return customUnauthorizedError(response);

      const allUsers = await this.prisma.user.findMany({
        where: { Auth: { type: 'USER' } },
      });
      response.json({ allUsers });
    } catch (error) {
      response.json({ error });
    }
  }

  async getUser(
    userId: string,
    email: string,
    response: Response,
  ): Promise<void> {
    try {
      const admin = await this.checkAdmin(email);

      if (!admin) return customUnauthorizedError(response);

      const user = await this.prisma.user.findMany({
        where: { id: userId },
        include: {
          Address: true,
          Cart: true,
          Order: true,
          Shoes: true,
        },
      });

      response.json({ user });
    } catch (error) {
      response.json({ error });
    }
  }

  async getAllVendors(email: string, response: Response): Promise<void> {
    try {
      const admin = await this.checkAdmin(email);

      if (!admin) return customUnauthorizedError(response);

      const allVendors = await this.prisma.user.findMany({
        where: { Auth: { type: 'VENDOR' } },
      });
      response.json({ allVendors });
    } catch (error) {
      response.json({ error });
    }
  }

  async addVendor(
    email: string,
    vendorData: RegisterVendorDto,
    response: Response,
    profilePic?: Express.Multer.File,
  ): Promise<void> {
    try {
      const admin = await this.checkAdmin(email);

      if (!admin) return customUnauthorizedError(response);

      const emailSearch = await this.prisma.user.findUnique({
        where: { email: vendorData?.email, Auth: { type: 'VENDOR' } },
      });

      if (emailSearch)
        return customError(
          response,
          'Vendor with provided email already exists',
        );

      if (!validateEmail(vendorData?.email))
        return customError(response, 'Please Provide a Valid Email');

      if (
        vendorData?.password !== vendorData?.confirmPassword ||
        vendorData?.password === ''
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

      const hashedPassword = await bcrypt.hash(vendorData?.password, 10);

      await this.prisma.user.create({
        data: {
          email: vendorData?.email,
          name: vendorData?.name,
          number: vendorData?.number,
          profilePic: url,
          company: vendorData?.company,
          description: vendorData?.description,
          Auth: {
            create: {
              password: hashedPassword,
              cloudinaryId,
              type: 'VENDOR',
            },
          },
        },
      });

      response.json({
        success: 'Vendor Registered Successfully',
      });
    } catch (error) {
      response.json({
        error,
      });
    }
  }
}
