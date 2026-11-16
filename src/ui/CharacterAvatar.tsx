import React, { useState, useEffect } from 'react';
import { CHARACTERS } from '../assets/characters';
import { CharacterId } from '../state/gameContext';

interface CharacterAvatarProps {
  characterId: CharacterId;
  alt: string;
  className?: string;
  emojiClassName?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  alt,
  className = 'w-full h-full',
  emojiClassName = 'text-4xl',
}) => {
  const [hasError, setHasError] = useState(false);
  const char = CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];

  useEffect(() => {
    setHasError(false);
  }, [characterId]);

  if (hasError) {
    return (
      <span className={`select-none leading-none flex items-center justify-center ${emojiClassName}`} aria-hidden="true">
        {char.emoji}
      </span>
    );
  }

  return (
    <img
      src={char.image}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  );
};
