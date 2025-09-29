"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnterPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Replace 'mysecretpassword' with your actual admin password
    if (password === "mysecretpassword") {
      document.cookie = `admin_password=${password}; path=/; max-age=86400`;
      router.push("/");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4">Enter Admin Password</h1>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Submit</button>
      </form>
    </div>
  );
}
