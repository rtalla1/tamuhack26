'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PillNavProps {
  items: NavItem[];
  activeId?: string;
  className?: string;
}

export default function PillNav({ items, activeId, className = '' }: PillNavProps) {
  const [active, setActive] = useState(activeId || items[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const updatePillPosition = useCallback(() => {
    if (!pillRef.current || !navRef.current) return;

    const activeItem = itemRefs.current.get(active);
    if (!activeItem) return;

    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // Kill any existing animation
    tweenRef.current?.kill();

    tweenRef.current = gsap.to(pillRef.current, {
      x: itemRect.left - navRect.left - 6,
      width: itemRect.width,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [active]);

  useEffect(() => {
    updatePillPosition();
    return () => {
      tweenRef.current?.kill();
    };
  }, [updatePillPosition]);

  const handleClick = useCallback((item: NavItem) => {
    setActive(item.id);
    // Defer the onClick to next tick to avoid state conflicts
    if (item.onClick) {
      setTimeout(() => item.onClick?.(), 0);
    }
  }, []);

  return (
    <div
      ref={navRef}
      className={`relative inline-flex items-center bg-neutral-900/80 backdrop-blur-md rounded-full p-1.5 border border-white/10 ${className}`}
    >
      {/* Animated pill background */}
      <div
        ref={pillRef}
        className="absolute h-[calc(100%-12px)] bg-white rounded-full"
        style={{ top: '6px', left: '6px' }}
      />

      {/* Nav items */}
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            if (el) itemRefs.current.set(item.id, el);
          }}
          onClick={() => handleClick(item)}
          className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors ${
            active === item.id
              ? 'text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
