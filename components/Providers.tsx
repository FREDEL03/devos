"use client";

import React from "react";
import { ToastContainer } from "./Toast";
import { ConfirmDialogContainer } from "./ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
      <ConfirmDialogContainer />
    </>
  );
}
