"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn secondary"
      style={{ position: "absolute", top: 20, right: 20 }}
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Выйти
    </button>
  );
}
