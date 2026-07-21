import { render, screen } from "@testing-library/react";

import { MarkdownContent } from "./markdown-content";

describe("MarkdownContent", () => {
  it("renders nothing for empty content", () => {
    const { container } = render(<MarkdownContent value="   " />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders common Markdown elements", () => {
    render(
      <MarkdownContent
        value={
          "## Titulo renderizado\n\nTexto **forte**\n\n- item\n\n[OpenAI](https://openai.com)"
        }
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Titulo renderizado" }),
    ).toBeVisible();
    expect(screen.getByText("forte").tagName).toBe("STRONG");
    expect(screen.getByRole("listitem")).toHaveTextContent("item");
    expect(screen.getByRole("link", { name: "OpenAI" })).toHaveAttribute(
      "href",
      "https://openai.com",
    );
  });

  it("renders stored html images responsively", () => {
    render(
      <MarkdownContent
        value={
          '<img src="https://example.com/question.png" alt="Diagrama da questao" width="640" />'
        }
      />,
    );

    const image = screen.getByRole("img", { name: "Diagrama da questao" });

    expect(image).toHaveAttribute("src", "https://example.com/question.png");
    expect(image).toHaveClass("max-w-full");
  });

  it("removes unsafe html, event attributes, and javascript urls", () => {
    const { container } = render(
      <MarkdownContent
        value={
          '<script>alert("xss")</script><img src="javascript:alert(1)" alt="Unsafe" onerror="alert(1)" /><a href="javascript:alert(1)">bad link</a><strong>safe</strong>'
        }
      />,
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Unsafe" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "bad link" })).not.toHaveAttribute(
      "href",
    );
    expect(screen.getByText("safe").tagName).toBe("STRONG");
    expect(container.innerHTML).not.toContain("onerror");
    expect(container.innerHTML).not.toContain("javascript:");
  });
});
