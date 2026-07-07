import React, { useState, useEffect } from 'react';
import { imageApi } from '../api/imageApi';
import ImageCard from '../components/ImageCard';
import { Search, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await imageApi.getImages();
        setImages(response.data);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Could not fetch gallery images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeImageIndex === null) return;
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, images.length]);

  const handleOpenLightbox = (index) => {
    setActiveImageIndex(index);
    document.body.style.overflow = 'hidden'; // Lock background scroll
  };

  const handleCloseLightbox = () => {
    setActiveImageIndex(null);
    document.body.style.overflow = 'unset'; // Unlock background scroll
  };

  const handleNextImage = () => {
    setActiveImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';
  const activeImage = activeImageIndex !== null ? images[activeImageIndex] : null;
  const activeImageUrl = activeImage 
    ? (activeImage.imagePath.startsWith('http') ? activeImage.imagePath : `${backendUrl}${activeImage.imagePath}`)
    : '';

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero Header */}
      <header style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1.5rem' }} className="animate-fade-in-up">
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '3rem', 
          fontWeight: '600',
          marginBottom: '1rem',
          letterSpacing: '-1px'
        }}>
          Aura Gallery
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          maxWidth: '600px', 
          margin: '0 auto 2rem auto',
          lineHeight: '1.6',
          fontSize: '1.05rem'
        }}>
          An immersive exhibition space showcasing selected moments of light, shadow, and architectural elegance.
        </p>

        {/* Search Bar */}
        <div style={{ 
          position: 'relative', 
          maxWidth: '450px', 
          margin: '0 auto',
        }}>
          <Search style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            width: '18px',
            height: '18px'
          }} />
          <input 
            type="text"
            placeholder="Search exhibitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ 
              paddingLeft: '2.75rem',
              borderRadius: '50px',
              fontSize: '1rem'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Exhibition Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(255,255,255,0.05)', 
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading collection...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="glass-panel animate-fade-in-up" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <ImageIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No exhibitions found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {searchQuery ? "Your search query didn't match any titles or descriptions." : "No images have been published to the gallery yet."}
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filteredImages.map((image) => {
            const originalIndex = images.findIndex(img => img._id === image._id);
            return (
              <ImageCard 
                key={image._id} 
                image={image} 
                onClick={() => handleOpenLightbox(originalIndex)}
              />
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activeImageIndex !== null && activeImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <button className="lightbox-close-btn" onClick={handleCloseLightbox}>
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button 
                className="lightbox-nav-btn lightbox-prev" 
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                className="lightbox-nav-btn lightbox-next" 
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-img-wrapper">
              <img src={activeImageUrl} alt={activeImage.title} />
            </div>
            <div className="lightbox-details animate-fade-in-up">
              <h2 className="lightbox-title">{activeImage.title}</h2>
              <p className="lightbox-desc">{activeImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
