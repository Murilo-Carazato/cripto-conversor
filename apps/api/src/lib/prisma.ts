import Prisma from '@prisma/client';

const { PrismaClient } = Prisma as unknown as { PrismaClient: new () => any };

export const prisma = new PrismaClient();
