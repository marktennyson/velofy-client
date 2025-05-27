"use client";
import VideoPlayer from "@/components/VideoPlayer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Video Player Example</h1>
        <VideoPlayer
          src="http://localhost:8000/tt0082096/master.m3u8"
          poster="https://m.media-amazon.com/images/I/713Qaw6z3AL.jpg"
        />
      </div>
    </main>
  );
}
