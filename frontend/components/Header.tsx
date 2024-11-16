"use client";

import React, { useState } from "react";
import { Menu, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [userMode, setUserMode] = useState<"passenger" | "driver">("passenger");

  return (
    <header className="bg-white p-4 flex justify-between items-center shadow-sm">
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Menu</span>
      </Button>
      <h1 className="text-lg font-semibold">PullUp</h1>
      <Button variant="ghost" size="icon">
        <User className="h-6 w-6" />
        <span className="sr-only">User menu</span>
      </Button>
    </header>
  );
};
