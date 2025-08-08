// index.js
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// POST login (for next-auth)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      id: user.id,
      name: user.username,
      email: user.email ?? "",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all users
app.get("/api/user", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActivated: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET invitations
app.get("/api/invitation", async (req, res) => {
  try {
    const invitations = await prisma.user.findMany({
      select: {
        email: true,
        isActivated: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(invitations);
  } catch (error) {
    console.error("Error getting invitations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST invitation
app.post("/api/invitation", async (req, res) => {
  const { email, role } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already invited" });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    await prisma.user.create({
      data: {
        email,
        role,
        isActivated: false,
        activationToken: token,
      },
    });

    const activationLink = `http://localhost:3000/activate?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "your-email@gmail.com", // Ganti sesuai
        pass: "your-app-password",    // App password, bukan password biasa
      },
    });

    await transporter.sendMail({
      from: '"SOC Dashboard" <your-email@gmail.com>',
      to: email,
      subject: "Invitation to SOC Dashboard",
      html: `<p>You have been invited to SOC Dashboard as ${role}.</p>
             <p>Click the link below to activate your account:</p>
             <a href="${activationLink}">${activationLink}</a>`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Invitation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST activation
app.post("/api/activate", async (req, res) => {
  const { token, username, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        activationToken: token,
        isActivated: false,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        password: hashedPassword,
        isActivated: true,
        activationToken: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Activation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server backend berjalan di http://localhost:${PORT}`);
});
