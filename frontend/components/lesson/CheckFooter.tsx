"use client";

import DuoButton from "@/components/shared/DuoButton";

/**
 * Shared submit bar. Each exercise component renders this itself, because
 * whether (and when) an exercise can be submitted is type-specific — match
 * pairs, for instance, has no button at all and completes on its own.
 */
export default function CheckFooter({
  disabled,
  onCheck,
  label = "Check",
}: {
  disabled: boolean;
  onCheck: () => void;
  label?: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t-2 border-duo-border bg-duo-bg">
      <div className="mx-auto flex max-w-2xl justify-end px-4 py-4">
        <DuoButton
          size="lg"
          disabled={disabled}
          onClick={onCheck}
          className="w-full sm:w-auto sm:min-w-[190px]"
        >
          {label}
        </DuoButton>
      </div>
    </div>
  );
}
