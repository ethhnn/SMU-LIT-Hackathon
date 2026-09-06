import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LocalVideo = {
  name: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
};

export async function GET() {
  const directory = path.join(process.cwd(), "public", "generated");

  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const videos = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
        .map(async (entry): Promise<LocalVideo> => {
          const details = await stat(path.join(directory, entry.name));
          return {
            name: entry.name,
            url: `/generated/${encodeURIComponent(entry.name)}`,
            sizeBytes: details.size,
            updatedAt: details.mtime.toISOString(),
          };
        }),
    );

    videos.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

    return NextResponse.json({ videos });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ videos: [] });
    }

    return NextResponse.json(
      { error: "The local video gallery could not be loaded." },
      { status: 500 },
    );
  }
}
