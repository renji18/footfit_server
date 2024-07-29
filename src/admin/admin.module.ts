import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  providers: [AdminService, PrismaService, CloudinaryService],
  controllers: [AdminController],
})
export class AdminModule {}
