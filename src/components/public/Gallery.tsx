"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { GalleryImage } from "@/lib/types";

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  if (!images.length) return null;

  return (
    <section id="gallery" className="section-pad mx-auto max-w-6xl py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Decor & Moments</p>
        <h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Gallery</h2>
      </div>

      <div className="masonry mt-12">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            className="masonry-item group relative w-full overflow-hidden rounded-2xl text-left"
            onClick={() => setActive(image)}
          >
            <Image
              src={image.imageUrl}
              alt={image.caption || "Wedding decor"}
              width={900}
              height={1200}
              className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-4 text-sm text-cream opacity-0 transition group-hover:opacity-100">
                {image.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <X />
          </button>
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.imageUrl}
              alt={active.caption || "Wedding decor"}
              width={1600}
              height={1200}
              className="max-h-[85vh] w-auto object-contain"
            />
            {active.caption && (
              <p className="bg-black/50 px-4 py-3 text-center text-sm text-cream">
                {active.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
