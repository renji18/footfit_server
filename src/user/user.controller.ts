import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request as ExpressRequest, Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('get')
  getUser(@Request() request: ExpressRequest, @Res() response: Response) {
    return this.userService.getUserDetails(
      request['user']['email'],
      request['user']['type'],
      response,
    );
  }
}
