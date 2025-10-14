'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  

  const galleryLogos = [
    'Chivas-logo-3.png',
    'Circus Mayhem-logo-variant-2.png',
    'Puddle jumpers-logo-1.png',
    'Sample Team-logo-3.png',
    'logo sports club-logo-variant-2.png'
  ];

  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{
        background: 'linear-gradient(to bottom, #0F012B 4%, #441F74 11%, #7A34DC 19%, #441F74 25%, #0F012B 39%)'
      }}
    >
      {/* 72% Opacity Overlay */}
      <div className="absolute inset-0 bg-black/28"></div>
      {/* Main Logo Section */}
      <div className="flex flex-col items-center justify-start pt-12 min-h-[80vh] relative z-10">
        {/* Logo Image */}
        <div className="w-96 h-[28rem] relative mb-6 font-display">
          <Image
            src="/lgs-logo.avif"
            alt="Sports Club Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Start Now Button */}
        <Link href="/create">
          <button
            className="bg-[#0F022B] border-2 border-gray-400 text-white hover:bg-[#441c72] px-10 py-5 rounded-full text-3xl font-extrabold tracking-wide transition-colors duration-700 ease-in-out shadow-xl"
          >
            Start Now
          </button>
        </Link>
      </div>

      {/* Logo Gallery Section */}
      <div className="pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {galleryLogos.map((logo, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-300 hover:border-gray-400 rounded-full hover:rounded-lg scale-75 hover:scale-110 transition-all duration-500 ease-out cursor-pointer aspect-square relative overflow-hidden group"
                onClick={() => openModal(`/gallery/${logo}`)}
              >
                <Image
                  src={`/gallery/${logo}`}
                  alt={`Team Logo ${index + 1}`}
                  fill
                  className="object-contain rounded-full group-hover:rounded-lg transition-all duration-500 ease-out"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-8">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-10"
            >
              ×
            </button>
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="Full size logo"
                width={800}
                height={800}
                className="object-contain max-w-full max-h-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}