import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';
import { google } from 'googleapis';

export const findOrCreateUser = async (
    email: string,
    name: string,
    avatarUrl: string,
    googleId: string,
    tokens: any
) => {
    // Calculate expiration date
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

    // Use transaction to create/update both User and GoogleCredential atomically
    const result = await prisma.$transaction(async (tx) => {
        // First, upsert the user
        const user = await tx.user.upsert({
            where: { email },
            update: { name, avatarUrl },
            create: { email, name, avatarUrl },
        });

        // Then, upsert the Google credential
        await tx.googleCredential.upsert({
            where: { userId: user.id },
            update: {
                googleId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined,
                scope: tokens.scope,
                expiresAt,
            },
            create: {
                userId: user.id,
                googleId,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token,
                scope: tokens.scope,
                expiresAt,
            },
        });

        return user;
    });

    return result;
};
