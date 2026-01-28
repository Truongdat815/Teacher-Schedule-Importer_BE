import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';
import { google } from 'googleapis';

export const findOrCreateUser = async (email: string, name: string, avatarUrl: string) => {
    return await prisma.user.upsert({
        where: { email },
        update: { name, avatarUrl },
        create: { email, name, avatarUrl },
    });
};

export const updateGoogleCredential = async (
    userId: string,
    profile: any,
    tokens: any
) => {
    // Calculate expiration date
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

    return await prisma.googleCredential.upsert({
        where: { userId },
        update: {
            googleId: profile.sub,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token, // Only update if provided (Google doesn't always send it)
            scope: tokens.scope,
            expiresAt: expiresAt,
        },
        create: {
            userId,
            googleId: profile.sub,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            scope: tokens.scope,
            expiresAt: expiresAt,
        },
    });
};
