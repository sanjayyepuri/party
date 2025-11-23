"use client";

import { Login } from "@ory/elements-react/theme";
import { OryCardRootProps, OryCardHeaderProps } from "@ory/elements-react";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Anchor } from "./ui/Anchor";
import { CustomText } from "./ui/Text";
import { useEffect, useState } from "react";

// Adapter for Card Root
const CardRoot = ({ children, className }: OryCardRootProps) => {
  return <Card className={className}>{children}</Card>;
};

// Adapter for Card Header
const CustomCardHeader = ({ children }: OryCardHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle>Welcome Back</CardTitle>
      <p className="text-gray-500 text-sm">Please sign in to continue</p>
    </CardHeader>
  );
};

export default function CustomLogin({ flow, config }: { flow: any; config: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Login
        flow={flow}
        config={config}
        components={{
          Card: {
            Root: CardRoot,
            Header: CustomCardHeader,
          },
          Node: {
            Input: Input,
            Button: Button,
            Anchor: Anchor,
            Text: CustomText,
          },
        }}
      />
    </div>
  );
}
