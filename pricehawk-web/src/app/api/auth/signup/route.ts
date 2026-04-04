import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  // Rate limit check
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = checkRateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, password, name } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Don't reveal that email exists - return generic message
      return NextResponse.json(
        { error: "Unable to create account. Please try logging in instead." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });

    // Sign in the user directly
    try {
      await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (signInError) {
      // If signIn fails, still return success but note the issue
      console.error("Auto-login failed after signup:", signInError);
      return NextResponse.json({
        success: true,
        message: "Account created. Please log in.",
        user: { id: user.id, email: user.email, name: user.name }
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
