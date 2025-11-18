'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    title: string;
    tagline?: string;
    description: string;
    challenge?: string;
    solution?: string;
    results?: string;
    technologies: string[];
    images?: Array<{
      src: string;
      alt: string;
      caption?: string;
      align?: 'left' | 'right' | 'center';
      position?: 'top' | 'middle' | 'bottom';
      isHeader?: boolean;
    }>;
  };
}

export default function CaseStudyModal({ isOpen, onClose, project }: CaseStudyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content case-study-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="case-study-header">
          <h2 className="case-study-title">{project.title}</h2>
        </div>

        <div className="case-study-body">
          <div className="case-study-section-group-wrapper">
            {/* Top images - float across Overview and Challenge */}
            {project.images && project.images.filter(img => img.position === 'top').length > 0 && (
              <>
                {project.images
                  .filter(img => img.position === 'top')
                  .map((img, index) => (
                    <div key={index} className={`case-study-image-wrapper case-study-image-${img.align || 'left'} case-study-image-float case-study-image-span-sections`}>
                      <div className="case-study-image case-study-image-inline">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={500}
                          height={800}
                          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                        />
                      </div>
                      {img.caption && (
                        <p className="case-study-image-caption">{img.caption}</p>
                      )}
                    </div>
                  ))}
              </>
            )}
            <div className="case-study-section case-study-section-group">
              <h3 className="case-study-section-title">Overview</h3>
              <div className="case-study-text-wrapper">
                <p className="case-study-text">{project.description}</p>
              </div>
            </div>

            {project.challenge && (
              <div className="case-study-section case-study-section-group">
                <h3 className="case-study-section-title">Challenge</h3>
                <div className="case-study-text-wrapper">
                  <p className="case-study-text">{project.challenge}</p>
                </div>
              </div>
            )}
          </div>

          <div className="case-study-section-group-wrapper">
            {/* Middle images - float across Solution and Results */}
            {project.images && project.images.filter(img => img.position === 'middle').length > 0 && (
              <>
                {project.images
                  .filter(img => img.position === 'middle')
                  .map((img, index) => (
                    <div key={index} className={`case-study-image-wrapper case-study-image-${img.align || 'left'} case-study-image-float case-study-image-span-sections`}>
                      <div className="case-study-image case-study-image-inline">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={500}
                          height={800}
                          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                        />
                      </div>
                      {img.caption && (
                        <p className="case-study-image-caption">{img.caption}</p>
                      )}
                    </div>
                  ))}
              </>
            )}
            {project.solution && (
              <div className="case-study-section case-study-section-group">
                <h3 className="case-study-section-title">Solution</h3>
                <div className="case-study-text-wrapper">
                  <p className="case-study-text">{project.solution}</p>
                </div>
              </div>
            )}

            {project.results && (
              <div className="case-study-section case-study-section-group">
                <h3 className="case-study-section-title">Results</h3>
                <div className="case-study-text-wrapper">
                  <p className="case-study-text">{project.results}</p>
                </div>
              </div>
            )}
          </div>

          <div className="case-study-section">
            <h3 className="case-study-section-title">Technologies</h3>
            <div className="case-study-tags">
              {project.technologies.map((tech, index) => (
                <span key={index} className="case-study-tag">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

