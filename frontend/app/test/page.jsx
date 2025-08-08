"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleInvite = async () => {
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    if (res.ok) {
      setInviteEmail("");
      setShowInvite(false);
      const updatedUsers = await fetch("/api/users").then((res) => res.json());
      setUsers(updatedUsers);
    } else {
      alert("Gagal mengundang user.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100 text-black">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setShowInvite(!showInvite)}>
            {showInvite ? "Cancel" : "Invite User"}
          </Button>
        </div>

        {showInvite && (
          <Card className="mb-6 bg-white shadow-md">
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button onClick={handleInvite}>Send Invitation</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{user.email}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-800 grid gap-2">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Password:</strong> {user.password}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>Status:</strong> {user.status}</div>
                <div><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</div>
                <div><strong>Updated At:</strong> {new Date(user.updatedAt).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <footer className="bg-[#0F172A] text-white text-center py-4 mt-10">
        &copy; 2025 SOC Dashboard. All rights reserved.
      </footer>
    </div>
  );
}
