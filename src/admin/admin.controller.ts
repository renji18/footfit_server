import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterVendorDto } from './dto/vendor.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @HttpCode(HttpStatus.OK)
  @Get('get/all/users')
  getAllUsers(@Request() req: ExpressRequest, @Res() response: Response) {
    return this.adminService.getAllUsers(req['user']['email'], response);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get/user/:userId')
  getUser(
    @Param('userId') userId: string,
    @Request() req: ExpressRequest,
    @Res() response: Response,
  ) {
    return this.adminService.getUser(userId, req['user']['email'], response);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get/all/vendors')
  getAllVendors(@Request() req: ExpressRequest, @Res() response: Response) {
    return this.adminService.getAllVendors(req['user']['email'], response);
  }

  @HttpCode(HttpStatus.OK)
  @Post('add/vendor')
  @UseInterceptors(FileInterceptor('profilePic'))
  addVendor(
    @Request() req: ExpressRequest,
    @Body() registerDto: RegisterVendorDto,
    @Res() response: Response,
    @UploadedFile() profilePic?: Express.Multer.File,
  ) {
    return this.adminService.addVendor(
      req['user']['email'],
      registerDto,
      response,
      profilePic,
    );
  }
}
