// Store a small thumbnail in the existing avatar_url text column; no storage bucket required.
export async function avatarThumbnail(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/gif"].includes(file.type))
    throw new Error("PNG・JPG・GIF画像を選択してください")
  if (file.size > 5 * 1024 * 1024)
    throw new Error("画像は5MB以下にしてください")
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("画像を読み込めませんでした")
    const size = Math.min(image.naturalWidth, image.naturalHeight)
    if (!size) throw new Error("画像を読み込めませんでした")
    ctx.drawImage(
      image,
      (image.naturalWidth - size) / 2,
      (image.naturalHeight - size) / 2,
      size,
      size,
      0,
      0,
      256,
      256
    )
    const result = canvas.toDataURL("image/webp", 0.82)
    if (result.length > 200000)
      throw new Error("画像サイズが大きすぎます。別の画像を選択してください")
    return result
  } finally {
    URL.revokeObjectURL(url)
  }
}
