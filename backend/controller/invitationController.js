import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// 🔍 GET all invitations
export async function getInvitations(req, res) {
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(invitations));
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}

// ✉️ POST invite user
export async function inviteUser(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { email, role } = JSON.parse(body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Email already invited" }));
      }

      const token =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

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
          user: "dffe85392@gmail.com", // GANTI dengan emailmu
          pass: "fdsj qnwy lkyy ilmg",    // GANTI dengan app password
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

      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error("Invitation error:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
}

// 🔓 POST activate user
export async function activateUser(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { token, username, password } = JSON.parse(body);

      const user = await prisma.user.findFirst({
        where: {
          activationToken: token,
          isActivated: false,
        },
      });

      if (!user) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Invalid or expired token" }));
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

      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error("Activation error:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
}
