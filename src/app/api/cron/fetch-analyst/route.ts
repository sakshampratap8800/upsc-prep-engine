import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyACQn9rA-5a4FNkwMEuPDEDxCfyrkDPe_o";
const PLAYLIST_ID = "PLQG-bVtyB9_ZvNhsoKlwHA1My0piHhlyf";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function GET(req: Request) {
  try {
    // 1. Fetch latest videos from playlist
    const playlistRes = await fetch(`${BASE_URL}/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=3&key=${API_KEY}`);
    if (!playlistRes.ok) throw new Error("Failed to fetch playlist items");
    const playlistData = await playlistRes.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({ success: false, error: "No videos found" });
    }

    let addedCount = 0;

    for (const item of playlistData.items) {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title;
      const publishedAt = item.snippet.publishedAt;
      
      // Check if we already have this video
      const existing = await prisma.analystPdf.findUnique({
        where: { videoId }
      });
      
      if (existing) continue; // Skip if already exists
      
      // Fetch full description
      const videoRes = await fetch(`${BASE_URL}/videos?part=snippet&id=${videoId}&key=${API_KEY}`);
      if (!videoRes.ok) continue;
      const videoData = await videoRes.json();
      
      if (!videoData.items || videoData.items.length === 0) continue;
      const description = videoData.items[0].snippet.description;
      
      // Extract PDF link
      const pdfMatch = description.match(/https?:\/\/[^\s<>"\']+\.pdf/i);
      if (pdfMatch) {
        const pdfUrl = pdfMatch[0];
        // Parse date from publishedAt
        const date = new Date(publishedAt);
        // Truncate to day start
        date.setUTCHours(0,0,0,0);
        
        try {
          await prisma.analystPdf.create({
            data: {
              date,
              title,
              videoId,
              pdfUrl
            }
          });
          addedCount++;
        } catch (e) {
          console.error("Failed to insert into DB (might be duplicate date)", e);
        }
      }
    }

    return NextResponse.json({ success: true, added: addedCount });
  } catch (error: any) {
    console.error("Cron fetch-analyst error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
