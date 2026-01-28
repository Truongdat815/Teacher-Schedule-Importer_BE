import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import * as authService from '../services/authService';
import { BadRequestError } from '../utils/errors';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import prisma from '../config/prisma';

/**
 * Create OAuth2 client with dynamic callback URL
 */
const getOAuth2Client = () => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackUrl = `${backendUrl}/api/auth/google/callback`;

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
    );
};

export const getAuthUrl = (req: Request, res: Response) => {
    const oauth2Client = getOAuth2Client();
    
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: 'security_token',
    });

    // Redirect user directly to Google OAuth
    res.redirect(url);
};

/**
 * Exchange Google authorization code for tokens (for frontend with PKCE flow)
 * Uses user's own Google OAuth credentials from database
 */
export const exchangeGoogleToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, userId } = req.body;

        if (!code) {
            throw new BadRequestError('Authorization code is required');
        }

        if (!userId) {
            throw new BadRequestError('User ID is required');
        }

        // Get user with their Google OAuth configuration
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Check if user has configured Google OAuth credentials
        if (!user.googleClientId || !user.googleClientSecret) {
            throw new BadRequestError('Google OAuth credentials not configured. Please configure them in settings.');
        }

        // Create OAuth2 client with user's credentials
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret,
            user.googleCallbackUrl || (process.env.FRONTEND_URL || 'http://localhost:5173/callback')
        );

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new BadRequestError('Email not found in Google profile');
        }

        if (!userInfo.data.id) {
            throw new BadRequestError('Google ID not found in profile');
        }

        // Save Google tokens for this user
        await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || user.name || 'Unknown',
            userInfo.data.picture || user.avatarUrl || '',
            userInfo.data.id,
            tokens
        );

        // Generate JWT tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Set secure httpOnly cookies
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Return user info and tokens
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.avatarUrl,
                },
                accessToken,
                refreshToken,
            },
        });

    } catch (error: any) {
        console.error('Token exchange error:', error);
        if (error instanceof BadRequestError) {
            return next(error);
        }
        next(error);
    }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const oauth2Client = getOAuth2Client();
        const code = req.query.code as string;

        if (!code) {
            throw new BadRequestError('Authorization code not found');
        }

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new BadRequestError('Email not found in Google profile');
        }

        if (!userInfo.data.id) {
            throw new BadRequestError('Google ID not found in profile');
        }

        // Save/update user in database
        const user = await authService.findOrCreateUser(
            userInfo.data.email,
            userInfo.data.name || 'Unknown',
            userInfo.data.picture || '',
            userInfo.data.id,
            tokens
        );

        // Generate JWT tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Set secure httpOnly cookies
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(
            `${frontendUrl}/dashboard?success=true&email=${encodeURIComponent(user.email)}`
        );

    } catch (error: any) {
        console.error('OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const errorMessage = error.message || 'Authentication failed';
        res.redirect(
            `${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`
        );
    }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken: refreshTokenFromBody } = req.body;

        if (!refreshTokenFromBody) {
            return next(new BadRequestError('Refresh token is required'));
        }

        // Verify refresh token
        const { verifyToken } = require('../utils/jwt');
        let decoded: any;
        try {
            decoded = verifyToken(refreshTokenFromBody);
        } catch (tokenError: any) {
            return next(new BadRequestError('Invalid or expired refresh token'));
        }

        // Check if it's a refresh token (not access token)
        if (!decoded.type || decoded.type !== 'refresh') {
            return next(new BadRequestError('Invalid token type. Refresh token required.'));
        }

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return next(new BadRequestError('User not found'));
        }

        // Generate new tokens
        const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
        const newAccessToken = generateAccessToken(user.id, user.email);
        const newRefreshToken = generateRefreshToken(user.id, user.email);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error: any) {
        // Handle unexpected errors
        if (error instanceof BadRequestError) {
            return next(error);
        }
        next(error);
    }
};

/**
 * Logout user and clear cookies
 */
export const logout = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Clear httpOnly cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error: any) {
        next(error);
    }
};
/**
 * Configure user's Google OAuth credentials
 */
export const configureGoogleOAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { googleClientId, googleClientSecret, googleCallbackUrl } = req.body;

        if (!userId) {
            throw new BadRequestError('User not authenticated');
        }

        if (!googleClientId || !googleClientSecret) {
            throw new BadRequestError('Google Client ID and Secret are required');
        }

        // Update user with Google OAuth credentials
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                googleClientId,
                googleClientSecret,
                googleCallbackUrl: googleCallbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/callback`,
            },
        });

        res.json({
            success: true,
            message: 'Google OAuth credentials configured successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    googleClientId: user.googleClientId,
                    // Don't return secret for security
                },
            },
        });
    } catch (error: any) {
        if (error instanceof BadRequestError) {
            return next(error);
        }
        next(error);
    }
};

/**
 * Get user's Google OAuth configuration
 */
export const getGoogleOAuthConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new BadRequestError('User not authenticated');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                googleClientId: true,
                googleCallbackUrl: true,
            },
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        res.json({
            success: true,
            data: {
                googleClientId: user.googleClientId,
                googleCallbackUrl: user.googleCallbackUrl,
                isConfigured: !!user.googleClientId,
            },
        });
    } catch (error: any) {
        if (error instanceof BadRequestError) {
            return next(error);
        }
        next(error);
    }
};