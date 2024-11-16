"use client";
import React, { useState } from "react";
import { Menu, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();
  const [userMode, setUserMode] = useState<"passenger" | "driver">("passenger");

  const handleProfileClick = () => {
    router.push("/profile-creation");
  };

  return (
    <header className="bg-white p-4 flex justify-between items-center shadow-sm">
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Menu</span>
      </Button>

      <h1 className="text-lg font-semibold">PullUp</h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleProfileClick}
        aria-label="Go to profile creation"
      >
        <User className="h-6 w-6" />
        <span className="sr-only">Profile creation</span>
      </Button>
    </header>
  );
};
