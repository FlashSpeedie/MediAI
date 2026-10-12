import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateRequest, registerSchema } from '@/lib/validation';
import { authRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResult = await authRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(registerSchema, body);

    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      const response = NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
      return addRateLimitHeaders(response, rateLimitResult);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const response = NextResponse.json({
      message: 'Account created successfully',
      user,
    }, { status: 201 });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Register error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addRateLimitHeaders(response, rateLimitResult);
  }
}
