import { existsSync } from "fs"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import { join } from "path"

export function getUploadsDir(): string {
  return join(process.cwd(), "uploads")
}

export async function saveLocalFile(filename: string, content: Buffer): Promise<string> {
  const uploadDir = getUploadsDir()

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const uniqueFilename = `${Date.now()}-${filename}`
  const filePath = join(uploadDir, uniqueFilename)
  await writeFile(filePath, content)
  return filePath
}

export async function readLocalFile(path: string): Promise<Buffer> {
  return readFile(path)
}

export async function deleteLocalFile(path: string): Promise<void> {
  if (!existsSync(path)) return
  await unlink(path)
}
