import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { customError } from 'src/utils/util.functions';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDetails(
    email: string,
    type: string,
    response: Response,
  ): Promise<void> {
    try {
      const include =
        type === 'user'
          ? {
              Address: true,
              Cart: true,
              Order: true,
            }
          : type === 'vendor'
            ? {
                company: true,
                description: true,
                Shoes: true,
              }
            : null;

      const user = await this.prisma.user.findUnique({
        where: { email },
        include,
      });
      if (!user) return customError(response, "User doesn't exist");

      response.json({ user });
    } catch (error) {
      response.json({ error });
    }
  }
}
