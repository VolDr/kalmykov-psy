import { PrismaClient } from '../../generated/prisma/client';

declare global {
	var prismaClient: PrismaClient | undefined;
}

const databaseUrl = import.meta.env.VITE_DATABASE_URL as string;

if (!globalThis.prismaClient) {
	globalThis.prismaClient = new PrismaClient({
		datasources: {
			db: {
				url: databaseUrl
			}
		}
	});
}

export const prisma = globalThis.prismaClient;
