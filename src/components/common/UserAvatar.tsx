'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  className?: string;
  fallback?: string;
}

export function isImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

export function UserAvatar({
  avatar,
  name,
  className,
  fallback = '🦊',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const cleanAvatar = avatar?.trim();
  const hasImage = !imageError && isImageUrl(cleanAvatar);

  if (hasImage && cleanAvatar) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center overflow-hidden rounded-full shrink-0 select-none w-full h-full',
          className
        )}
      >
        <img
          src={cleanAvatar}
          alt={name || 'Avatar'}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </span>
    );
  }

  // If text/emoji, render cleanly or fallback
  const displayContent =
    cleanAvatar && cleanAvatar.length <= 4
      ? cleanAvatar
      : name
      ? name.trim().charAt(0).toUpperCase()
      : fallback;

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center shrink-0 select-none leading-none w-full h-full',
        className
      )}
    >
      {displayContent}
    </span>
  );
}
