export async function uploadQuestionMarkdownImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/uploads/markdown-images", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    if (payload.error === "VALIDATION_ERROR") {
      throw new Error("A imagem selecionada nao e suportada.");
    }

    throw new Error("Nao foi possivel enviar a imagem.");
  }

  return String(payload.image.url);
}
