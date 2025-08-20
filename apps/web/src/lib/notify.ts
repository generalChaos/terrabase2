"use client";
import { toast } from "sonner";

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  promise<T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) {
    return toast.promise(p, msgs);
  },
};
