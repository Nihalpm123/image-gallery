import React from 'react';

const ImageCard = ({ image, onClick }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';
  const imageUrl = image.imagePath.startsWith('http') 
    ? image.imagePath 
    : `${backendUrl}${image.imagePath}`;

  return (
    <div className="image-card animate-fade-in-up" onClick={onClick}>
      <div className="image-card-img-container">
        <img 
          src={imageUrl} 
          alt={image.title} 
          loading="lazy" 
        />
      </div>
      <div className="image-card-overlay">
        <div className="image-card-info">
          <h3 className="image-card-title">{image.title}</h3>
          <p className="image-card-desc">{image.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
