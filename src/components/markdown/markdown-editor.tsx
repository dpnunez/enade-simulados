"use client";

import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import dynamic from "next/dynamic";
import { forwardRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  resetKey?: string | number;
  ariaLabel?: string;
  className?: string;
};

type LoadedEditorProps = Pick<MDXEditorProps, "markdown" | "onChange"> & {
  onBlur?: () => void;
  ariaLabel?: string;
  className?: string;
};

const LoadedMarkdownEditor = dynamic(
  () =>
    import("@mdxeditor/editor").then((editor) => {
      const Editor = forwardRef<MDXEditorMethods, LoadedEditorProps>(
        ({ markdown, onChange, onBlur, ariaLabel, className }, ref) => (
          <editor.MDXEditor
            ref={ref}
            markdown={markdown}
            onChange={onChange}
            onBlur={onBlur}
            aria-label={ariaLabel}
            className={cn(
              "min-h-56 rounded-md border border-input bg-background text-foreground",
              className,
            )}
            contentEditableClassName="min-h-40 px-3 py-2 text-sm outline-none"
            plugins={[
              editor.headingsPlugin(),
              editor.listsPlugin(),
              editor.quotePlugin(),
              editor.thematicBreakPlugin(),
              editor.markdownShortcutPlugin(),
              editor.toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <editor.UndoRedo />
                    <editor.Separator />
                    <editor.BlockTypeSelect />
                    <editor.BoldItalicUnderlineToggles />
                    <editor.Separator />
                    <editor.ListsToggle />
                    <editor.InsertThematicBreak />
                  </>
                ),
              }),
            ]}
          />
        ),
      );
      Editor.displayName = "LoadedMarkdownEditor";
      return Editor;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-56 rounded-md border border-input bg-muted/40" />
    ),
  },
);

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  resetKey,
  ariaLabel,
  className,
}: MarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    editorRef.current?.setMarkdown(value);
  }, [resetKey]);

  return (
    <LoadedMarkdownEditor
      ref={editorRef}
      markdown={value}
      onChange={(markdown, initialMarkdownNormalize) => {
        if (!initialMarkdownNormalize) {
          onChange(markdown);
        }
      }}
      onBlur={onBlur}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
