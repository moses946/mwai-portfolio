import React from 'react';
import '../Styles/PhotoCard.css'; // Import the CSS file

const PhotoCard = ({ photoSrc, altText }) => {
  return (
    <div className="photo-card">
      <div className="photo-background">
        <img src={photoSrc} alt={altText} className="photo" />
      </div>
    </div>
  );
};

export default PhotoCard;
