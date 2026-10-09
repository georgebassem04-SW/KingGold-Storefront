/** Password field with a show/hide eye button */
"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export const PasswordInput = forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { showLabel: string; hideLabel: string }>(
  function PasswordInput({ showLabel, hideLabel, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      // dir="ltr" on the wrapper keeps the eye button on the right, away from the typed text, also on Arabic pages
      <div className="relative" dir="ltr">
        <Input ref={ref} type={visible ? "text" : "password"} className="pe-10" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
