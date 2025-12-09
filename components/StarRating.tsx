
import React, { useState } from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  count: number;
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ count, value, onChange, size = 6 }) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);
  const stars = Array(count).fill(0);

  const handleClick = (value: number) => {
    onChange(value);
  };

  const handleMouseOver = (newHoverValue: number) => {
    setHoverValue(newHoverValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(undefined);
  };

  return (
    <div className="flex items-center">
      {stars.map((_, index) => {
        const ratingValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`w-${size} h-${size} cursor-pointer transition-colors ${
              (hoverValue || value) >= ratingValue ? 'text-yellow-400' : 'text-secondary opacity-50'
            }`}
            onClick={() => handleClick(ratingValue)}
            onMouseOver={() => handleMouseOver(ratingValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
};