import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  value: string | null | undefined;
  className?: string;
  compact?: boolean;
};

type MarkdownSanitizeSchema = NonNullable<Parameters<typeof rehypeSanitize>[0]>;

export const markdownSanitizeSchema: MarkdownSanitizeSchema = {
  tagNames: [
    "a",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
  ],
  attributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["align"],
    td: ["align"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
  strip: ["script", "style", "iframe", "object", "embed", "form", "svg"],
};

function isExternalUrl(href: string | undefined) {
  return href?.startsWith("http://") || href?.startsWith("https://");
}

const markdownComponents: Components = {
  a: ({ className, href, children, title }) => (
    <a
      className={cn("font-medium text-primary underline underline-offset-4", className)}
      href={href}
      role={href ? undefined : "link"}
      title={title}
      target={isExternalUrl(href) ? "_blank" : undefined}
      rel={isExternalUrl(href) ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  img: ({ className, src, alt, title, width, height }) => {
    if (!src) return null;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cn("max-w-full rounded-md border object-contain", className)}
        src={src}
        alt={alt ?? ""}
        title={title}
        width={width}
        height={height}
        loading="lazy"
      />
    );
  },
};

export function MarkdownContent({
  value,
  className,
  compact = false,
}: MarkdownContentProps) {
  const markdown = value?.trim();

  if (!markdown) return null;

  return (
    <div
      className={cn(
        "space-y-3 break-words leading-relaxed",
        "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
        "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-tight",
        "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-tight",
        "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:leading-tight",
        "[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:leading-tight",
        "[&_h6]:text-sm [&_h6]:font-medium [&_h6]:leading-tight [&_h6]:text-muted-foreground",
        "[&_hr]:border-border",
        "[&_ol]:list-decimal [&_ol]:pl-5",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
        "[&_td]:border [&_td]:px-2 [&_td]:py-1",
        "[&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:font-medium",
        "[&_ul]:list-disc [&_ul]:pl-5",
        compact ? "space-y-1.5" : "",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
