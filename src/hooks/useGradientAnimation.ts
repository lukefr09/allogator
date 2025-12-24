import { useState, useEffect, useRef, useMemo } from 'react';
import { AllocationResult } from '../types';
import { THRESHOLDS } from '../constants';

interface RGB {
  r: number;
  g: number;
  b: number;
}

const GREEN: RGB = { r: 16, g: 185, b: 129 };
const YELLOW: RGB = { r: 251, g: 191, b: 36 };
const RED: RGB = { r: 239, g: 68, b: 68 };

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(from: RGB, to: RGB, t: number): RGB {
  return {
    r: lerp(from.r, to.r, t),
    g: lerp(from.g, to.g, t),
    b: lerp(from.b, to.b, t)
  };
}

export function useGradientAnimation(allocations: AllocationResult[]): RGB {
  const [gradientColor, setGradientColor] = useState<RGB>(GREEN);
  const animationFrameRef = useRef<number>();

  const targetColor = useMemo(() => {
    if (allocations.length === 0) return GREEN;

    const totalDifference = allocations.reduce((sum, allocation) => {
      return sum + Math.abs(allocation.difference);
    }, 0);

    const avgDifference = totalDifference / allocations.length;
    const midThreshold = (THRESHOLDS.ALLOCATION_ON_TARGET + THRESHOLDS.ALLOCATION_SLIGHTLY_OFF) / 2;

    if (avgDifference <= midThreshold) {
      const t = avgDifference / midThreshold;
      return lerpColor(GREEN, YELLOW, t);
    } else {
      const t = Math.min((avgDifference - midThreshold) / midThreshold, 1);
      return lerpColor(YELLOW, RED, t);
    }
  }, [allocations]);

  useEffect(() => {
    const animate = () => {
      setGradientColor(current => {
        const dr = targetColor.r - current.r;
        const dg = targetColor.g - current.g;
        const db = targetColor.b - current.b;

        if (Math.abs(dr) < 1 && Math.abs(dg) < 1 && Math.abs(db) < 1) {
          return targetColor;
        }

        return {
          r: current.r + dr * 0.02,
          g: current.g + dg * 0.02,
          b: current.b + db * 0.02
        };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetColor]);

  return gradientColor;
}
