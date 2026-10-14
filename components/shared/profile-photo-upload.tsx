"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProfileImage, uploadProfileImage } from "@/lib/arena/actions";
import { SignOutButton } from "./sign-out-button";

export function ProfilePhotoUpload({
  avatarUrl,
  compact = false,
}: {
  avatarUrl?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDetailsElement>(null);
  const [pending, setPending] = React.useState(false);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPending(true);
    try {
      menuRef.current?.removeAttribute("open");
      const formData = new FormData();
      formData.set("avatar", file);
      const result = await uploadProfileImage(formData);
      if (result.error) {
        console.error("Profile photo upload failed:", result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error("Profile photo upload failed:", error);
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Remove your profile photo?")) return;

    menuRef.current?.removeAttribute("open");
    setPending(true);
    try {
      const result = await deleteProfileImage();
      if (result.error) {
        console.error("Profile photo removal failed:", result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error("Profile photo removal failed:", error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={upload}
        disabled={pending}
        className="sr-only"
        aria-label="Choose a profile photo from your device"
      />
      {compact ? (
        <details ref={menuRef} className="group relative">
          <summary
            className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-sand-400 bg-sand-50 px-2 text-xs text-ink-700 transition-colors hover:bg-sand-200 [&::-webkit-details-marker]:hidden"
            aria-label="Profile photo options"
          >
            <Camera aria-hidden className="size-3.5" />
            Photo
            <ChevronDown aria-hidden className="size-3 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-md border border-sand-400 bg-sand-50 p-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs text-ink-700 hover:bg-sand-200 disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
            >
              <Camera aria-hidden className="size-3.5" />
              {pending ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs text-ink-700 hover:bg-sand-200 disabled:opacity-50"
                onClick={remove}
                disabled={pending}
              >
                <Trash2 aria-hidden className="size-3.5" />
                Remove photo
              </button>
            ) : null}
            <div className="my-1 border-t border-sand-300" />
            <SignOutButton variant="menu" />
          </div>
        </details>
      ) : (
        <>
          <Button
            type="button"
            size="md"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            <Camera aria-hidden />
            {pending ? "Uploading…" : avatarUrl ? "Change photo" : "Choose photo"}
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              size="md"
              variant="ghost"
              onClick={remove}
              disabled={pending}
              aria-label="Remove profile photo"
              title="Remove profile photo"
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
