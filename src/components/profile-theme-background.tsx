import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  Dimensions,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { getProfileTheme, ProfileTheme } from '@/constants/profile-themes';

interface ProfileThemeBackgroundProps {
  themeId?: string | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  isPreview?: boolean;
  overlayOpacity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ProfileThemeBackground({
  themeId,
  style,
  children,
  isPreview = false,
  overlayOpacity,
}: ProfileThemeBackgroundProps) {
  const theme = getProfileTheme(themeId);

  if (!theme) {
    return <View style={[styles.wrapper, style]}>{children}</View>;
  }

  const defaultOverlay = isPreview ? 0.05 : 0.38;
  const finalOverlayOpacity = overlayOpacity !== undefined ? overlayOpacity : defaultOverlay;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bgBase }, style]}>
      {/* Animated Visual Effect Engine */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Platform.OS === 'web' ? (
          <WebCanvasThemeEngine theme={theme} isPreview={isPreview} />
        ) : (
          <NativeThemeEngine theme={theme} isPreview={isPreview} />
        )}
      </View>

      {/* Readability Contrast Overlay */}
      {!isPreview && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `rgba(0, 0, 0, ${finalOverlayOpacity})`,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Profile Content */}
      {children}
    </View>
  );
}

// =========================================================================
// WEB HIGH-PERFORMANCE CANVAS ANIMATION ENGINE (60 FPS Procedural Shaders)
// =========================================================================

function WebCanvasThemeEngine({ theme, isPreview }: { theme: ProfileTheme; isPreview: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || (isPreview ? 180 : window.innerWidth || 400));
    let height = (canvas.height = canvas.parentElement?.clientHeight || (isPreview ? 120 : window.innerHeight || 800));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initializer per theme
    const state = initThemeState(theme.id, width, height, isPreview);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Draw active theme animation
      drawThemeAnimation(theme.id, ctx, width, height, state, currentTime * 0.001, dt, isPreview);

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme.id, isPreview]);

  return (
    // @ts-ignore
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
}

// -------------------------------------------------------------
// Theme State Initializers
// -------------------------------------------------------------
function initThemeState(themeId: string, w: number, h: number, isPreview: boolean): any {
  switch (themeId) {
    case 'matrix': {
      const fontSize = isPreview ? 10 : 14;
      const cols = Math.floor(w / fontSize) + 1;
      const drops = Array.from({ length: cols }, () => Math.random() * -50);
      const speeds = Array.from({ length: cols }, () => 0.4 + Math.random() * 0.5);
      return { fontSize, cols, drops, speeds, chars: '01アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロ0123456789ABCDEF$#@%&*' };
    }
    case 'particles': {
      const count = isPreview ? 18 : 55;
      const particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        radius: Math.random() * 2.5 + 1.2,
        color: Math.random() > 0.4 ? '#FFEAA7' : '#00CEC9',
      }));
      return { particles };
    }
    case 'starfield': {
      const count = isPreview ? 40 : 140;
      const stars = Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * w * 2,
        y: (Math.random() - 0.5) * h * 2,
        z: Math.random() * w,
        pz: Math.random() * w,
        size: Math.random() * 1.5 + 0.8,
      }));
      return { stars };
    }
    case 'snowfall': {
      const count = isPreview ? 20 : 70;
      const flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2.5 + 1,
        speed: 15 + Math.random() * 25,
        swaySpeed: 1 + Math.random() * 2,
        swayWidth: 10 + Math.random() * 20,
        seed: Math.random() * 100,
      }));
      return { flakes };
    }
    case 'cherry_blossom': {
      const count = isPreview ? 15 : 45;
      const petals = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 7 + 6,
        speedY: 20 + Math.random() * 25,
        speedX: 10 + Math.random() * 15,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
      }));
      return { petals };
    }
    case 'rainy_window': {
      const dropCount = isPreview ? 25 : 80;
      const drops = Array.from({ length: dropCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        length: Math.random() * 18 + 10,
        speed: 140 + Math.random() * 200,
        opacity: Math.random() * 0.5 + 0.3,
      }));
      const bokeh = Array.from({ length: isPreview ? 4 : 10 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 40 + 20,
        color: Math.random() > 0.5 ? 'rgba(243, 156, 18, 0.08)' : 'rgba(52, 152, 219, 0.08)',
      }));
      return { drops, bokeh };
    }
    case 'fire': {
      const count = isPreview ? 35 : 100;
      const particles = Array.from({ length: count }, () => ({
        x: w * 0.5 + (Math.random() - 0.5) * w * 0.7,
        y: h + Math.random() * 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -(Math.random() * 45 + 35),
        life: 0,
        maxLife: Math.random() * 2 + 1.5,
        size: Math.random() * 16 + 8,
      }));
      return { particles };
    }
    case 'lava_lamp': {
      const count = isPreview ? 4 : 8;
      const blobs = Array.from({ length: count }, (_, i) => ({
        x: w * (0.2 + 0.6 * (i / count)),
        y: Math.random() * h,
        radius: Math.random() * 35 + (isPreview ? 20 : 40),
        vy: (Math.random() - 0.5) * 15,
        color: i % 3 === 0 ? '#FF7675' : i % 3 === 1 ? '#6C5CE7' : '#FD79A8',
      }));
      return { blobs };
    }
    case 'clouds': {
      const count = isPreview ? 4 : 7;
      const clouds = Array.from({ length: count }, () => ({
        x: Math.random() * w * 1.5 - w * 0.25,
        y: Math.random() * h * 0.8,
        width: Math.random() * (isPreview ? 120 : 280) + 100,
        height: Math.random() * (isPreview ? 40 : 90) + 40,
        speed: Math.random() * 6 + 4,
        opacity: Math.random() * 0.12 + 0.08,
      }));
      return { clouds };
    }
    default:
      return {};
  }
}

// -------------------------------------------------------------
// Canvas Drawing Pipeline
// -------------------------------------------------------------
function drawThemeAnimation(
  themeId: string,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: any,
  t: number,
  dt: number,
  isPreview: boolean
) {
  // Clear / Fade Base
  ctx.clearRect(0, 0, w, h);

  switch (themeId) {
    case 'matrix': {
      ctx.fillStyle = '#020A04';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${state.fontSize}px monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < state.cols; i++) {
        const char = state.chars[Math.floor(Math.random() * state.chars.length)];
        const x = i * state.fontSize;
        const y = state.drops[i] * state.fontSize;

        // Glowing bright lead character
        ctx.fillStyle = '#E8FFE8';
        ctx.shadowColor = '#00FF66';
        ctx.shadowBlur = 8;
        ctx.fillText(char, x, y);

        // Trail character
        ctx.fillStyle = '#00FF66';
        ctx.shadowBlur = 0;
        ctx.fillText(char, x, y - state.fontSize);

        state.drops[i] += state.speeds[i];
        if (state.drops[i] * state.fontSize > h && Math.random() > 0.975) {
          state.drops[i] = 0;
        }
      }
      break;
    }

    case 'cyberpunk': {
      ctx.fillStyle = '#0D0818';
      ctx.fillRect(0, 0, w, h);

      // Distant horizon neon grid
      const horizonY = h * 0.65;
      const gradSky = ctx.createLinearGradient(0, 0, 0, horizonY);
      gradSky.addColorStop(0, '#0D0818');
      gradSky.addColorStop(1, '#1E0B38');
      ctx.fillStyle = gradSky;
      ctx.fillRect(0, 0, w, horizonY);

      // Perspective Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1;

      for (let x = -w; x <= w * 2; x += w * 0.15) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizonY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal moving grid bars
      const gridOffset = (t * 20) % 25;
      for (let y = horizonY; y <= h; y += (y - horizonY) * 0.35 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridOffset * ((y - horizonY) / (h - horizonY)));
        ctx.lineTo(w, y + gridOffset * ((y - horizonY) / (h - horizonY)));
        ctx.stroke();
      }

      // Neon City Silhouette Pillars
      ctx.fillStyle = '#140A28';
      const buildingWidth = w * 0.12;
      for (let i = 0; i < 9; i++) {
        const bHeight = 40 + Math.sin(i * 3) * 30 + 30;
        ctx.fillRect(i * buildingWidth, horizonY - bHeight, buildingWidth - 4, bHeight);
        // Lit neon window
        if (i % 2 === 0) {
          ctx.fillStyle = i % 4 === 0 ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 0, 127, 0.6)';
          ctx.fillRect(i * buildingWidth + 4, horizonY - bHeight + 8, 4, 4);
          ctx.fillStyle = '#140A28';
        }
      }

      // Moving Laser Light Bars
      const laser1X = ((t * 80) % (w + 200)) - 100;
      ctx.strokeStyle = '#00F0FF';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laser1X, horizonY - 40);
      ctx.lineTo(laser1X + 80, horizonY - 40);
      ctx.stroke();

      const laser2X = w - (((t * 60) % (w + 200)) - 100);
      ctx.strokeStyle = '#FF007F';
      ctx.shadowColor = '#FF007F';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(laser2X, horizonY - 20);
      ctx.lineTo(laser2X - 70, horizonY - 20);
      ctx.stroke();

      ctx.shadowBlur = 0;
      break;
    }

    case 'aurora': {
      ctx.fillStyle = '#040F1E';
      ctx.fillRect(0, 0, w, h);

      // Star twinkles
      for (let i = 0; i < 25; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 61) % (h * 0.5);
        const op = 0.3 + 0.7 * Math.sin(t * 2 + i);
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Undulating Aurora Light Curtains
      const drawAuroraWave = (baseY: number, color1: string, color2: string, speed: number, amplitude: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, baseY);

        for (let x = 0; x <= w; x += 10) {
          const y = baseY + Math.sin(x * 0.008 + t * speed) * amplitude + Math.cos(x * 0.015 - t * speed * 0.5) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, baseY + amplitude);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'blur(12px)';
        ctx.fill();
        ctx.restore();
      };

      drawAuroraWave(h * 0.35, 'rgba(0, 255, 194, 0.28)', 'rgba(0, 229, 255, 0.05)', 0.4, 45);
      drawAuroraWave(h * 0.48, 'rgba(0, 229, 255, 0.22)', 'rgba(138, 43, 226, 0.08)', -0.3, 55);
      drawAuroraWave(h * 0.62, 'rgba(138, 43, 226, 0.25)', 'rgba(0, 255, 194, 0.02)', 0.2, 50);
      break;
    }

    case 'starfield': {
      ctx.fillStyle = '#040612';
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let star of state.stars) {
        star.z -= 18 * dt;
        if (star.z <= 0) {
          star.z = w;
          star.pz = w;
          star.x = (Math.random() - 0.5) * w * 2;
          star.y = (Math.random() - 0.5) * h * 2;
        }

        const k = 120 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        const pk = 120 / star.pz;
        const ppx = star.x * pk + cx;
        const ppy = star.y * pk + cy;
        star.pz = star.z;

        if (px >= 0 && px <= w && py >= 0 && py <= h) {
          const shade = Math.min(1, Math.max(0.2, (1 - star.z / w) * 1.2));
          ctx.strokeStyle = `rgba(224, 231, 255, ${shade})`;
          ctx.lineWidth = star.size * (1 - star.z / w) + 0.5;
          ctx.beginPath();
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
      break;
    }

    case 'nebula': {
      ctx.fillStyle = '#0C041C';
      ctx.fillRect(0, 0, w, h);

      const drawNebulaOrb = (cx: number, cy: number, r: number, color: string) => {
        const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        radGrad.addColorStop(0, color);
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      };

      const orb1X = w * 0.35 + Math.sin(t * 0.2) * 40;
      const orb1Y = h * 0.3 + Math.cos(t * 0.25) * 40;
      drawNebulaOrb(orb1X, orb1Y, isPreview ? 80 : 180, 'rgba(224, 86, 253, 0.28)');

      const orb2X = w * 0.65 + Math.cos(t * 0.18) * 50;
      const orb2Y = h * 0.65 + Math.sin(t * 0.22) * 50;
      drawNebulaOrb(orb2X, orb2Y, isPreview ? 90 : 200, 'rgba(104, 109, 224, 0.32)');

      const orb3X = w * 0.5 + Math.sin(t * 0.3) * 30;
      const orb3Y = h * 0.5 + Math.cos(t * 0.28) * 30;
      drawNebulaOrb(orb3X, orb3Y, isPreview ? 70 : 150, 'rgba(243, 104, 224, 0.22)');

      // Embedded stardust
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137) % w;
        const sy = (i * 89) % h;
        const op = 0.2 + 0.6 * Math.sin(t * 1.5 + i);
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      break;
    }

    case 'ocean': {
      ctx.fillStyle = '#03192B';
      ctx.fillRect(0, 0, w, h);

      // Layered horizontal water waves
      const drawWaveLayer = (yOffset: number, color: string, speed: number, amp: number) => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, yOffset);

        for (let x = 0; x <= w; x += 15) {
          const y = yOffset + Math.sin(x * 0.01 + t * speed) * amp + Math.cos(x * 0.02 + t * speed * 0.6) * (amp * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };

      drawWaveLayer(h * 0.35, 'rgba(0, 210, 211, 0.15)', 0.8, 18);
      drawWaveLayer(h * 0.52, 'rgba(72, 219, 251, 0.18)', -0.6, 22);
      drawWaveLayer(h * 0.70, 'rgba(9, 132, 227, 0.25)', 0.5, 25);

      // Caustic light reflections
      ctx.strokeStyle = 'rgba(72, 219, 251, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const cy = h * 0.4 + i * (h * 0.12) + Math.sin(t * 0.8 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.bezierCurveTo(w * 0.33, cy - 15, w * 0.66, cy + 15, w, cy);
        ctx.stroke();
      }
      break;
    }

    case 'rainy_window': {
      ctx.fillStyle = '#0F1722';
      ctx.fillRect(0, 0, w, h);

      // Distant bokeh lights
      for (let b of state.bokeh) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      }

      // Sliding raindrops
      ctx.strokeStyle = 'rgba(116, 185, 255, 0.7)';
      ctx.lineWidth = 1.5;

      for (let drop of state.drops) {
        drop.y += drop.speed * dt;
        if (drop.y > h + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 1, drop.y + drop.length);
        ctx.stroke();
      }
      break;
    }

    case 'fire': {
      ctx.fillStyle = '#190805';
      ctx.fillRect(0, 0, w, h);

      for (let p of state.particles) {
        p.life += dt;
        p.x += p.vx * dt + Math.sin(p.life * 4) * 0.8;
        p.y += p.vy * dt;

        if (p.life >= p.maxLife || p.y < h * 0.2) {
          p.life = 0;
          p.x = w * 0.5 + (Math.random() - 0.5) * w * 0.7;
          p.y = h + Math.random() * 15;
        }

        const progress = p.life / p.maxLife;
        const currentSize = p.size * (1 - progress * 0.7);

        const r = 255;
        const g = Math.floor(180 * (1 - progress));
        const b = 40;
        const alpha = Math.max(0, (1 - progress) * 0.45);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }
      break;
    }

    case 'snowfall': {
      ctx.fillStyle = '#0C1829';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FFFFFF';
      for (let f of state.flakes) {
        f.y += f.speed * dt;
        f.x += Math.sin(t * f.swaySpeed + f.seed) * (f.swayWidth * dt);

        if (f.y > h + 10) {
          f.y = -10;
          f.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'cherry_blossom': {
      ctx.fillStyle = '#1E0E18';
      ctx.fillRect(0, 0, w, h);

      for (let p of state.petals) {
        p.y += p.speedY * dt;
        p.x += p.speedX * dt + Math.sin(t * 1.5 + p.rot) * 0.6;
        p.rot += p.rotSpeed * dt;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) {
          p.x = -20;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 170, 167, 0.65)';
        ctx.fill();

        ctx.restore();
      }
      break;
    }

    case 'galaxy': {
      ctx.fillStyle = '#060317';
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.45);
      ctx.rotate(t * 0.15);

      // Spiral arms
      const armStars = isPreview ? 80 : 250;
      for (let i = 0; i < armStars; i++) {
        const theta = i * 0.15;
        const r = Math.pow(theta, 1.4) * (isPreview ? 6 : 14);
        const x1 = Math.cos(theta) * r;
        const y1 = Math.sin(theta) * r;
        const x2 = Math.cos(theta + Math.PI) * r;
        const y2 = Math.sin(theta + Math.PI) * r;

        ctx.fillStyle = i % 2 === 0 ? 'rgba(189, 197, 129, 0.6)' : 'rgba(130, 88, 159, 0.6)';
        ctx.fillRect(x1, y1, 2, 2);
        ctx.fillRect(x2, y2, 2, 2);
      }

      ctx.restore();

      // Glowing galactic core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, isPreview ? 35 : 75);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      coreGrad.addColorStop(0.3, 'rgba(189, 197, 129, 0.4)');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, isPreview ? 35 : 75, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vaporwave': {
      ctx.fillStyle = '#1B092A';
      ctx.fillRect(0, 0, w, h);

      // Retro 80s Sun
      const sunY = h * 0.38;
      const sunRadius = isPreview ? 40 : 80;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
      sunGrad.addColorStop(0, '#FFEAA7');
      sunGrad.addColorStop(0.5, '#FD79A8');
      sunGrad.addColorStop(1, '#6C5CE7');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sun scanline slits
      for (let i = 0; i < 6; i++) {
        const slitY = sunY + (i / 6) * sunRadius;
        ctx.fillStyle = '#1B092A';
        ctx.fillRect(w * 0.5 - sunRadius, slitY, sunRadius * 2, i * 1.5 + 2);
      }

      // Wireframe perspective grid floor
      const gridY = h * 0.55;
      ctx.strokeStyle = '#FD79A8';
      ctx.lineWidth = 1;

      for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.12) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, gridY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const offset = (t * 22) % 20;
      for (let y = gridY; y <= h; y += (y - gridY) * 0.35 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset * ((y - gridY) / (h - gridY)));
        ctx.lineTo(w, y + offset * ((y - gridY) / (h - gridY)));
        ctx.stroke();
      }
      break;
    }

    case 'glitch': {
      ctx.fillStyle = '#0E0F14';
      ctx.fillRect(0, 0, w, h);

      // Horizontal scanlines
      ctx.fillStyle = 'rgba(0, 206, 201, 0.04)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }

      // Glitch displacement burst
      if (Math.sin(t * 7) > 0.85) {
        const glitchY = (Math.sin(t * 13) * 0.5 + 0.5) * h;
        const glitchHeight = 25;
        ctx.fillStyle = 'rgba(0, 206, 201, 0.35)';
        ctx.fillRect(Math.sin(t * 40) * 15, glitchY, w, glitchHeight);
        ctx.fillStyle = 'rgba(214, 48, 49, 0.35)';
        ctx.fillRect(-Math.sin(t * 40) * 15, glitchY + 5, w, glitchHeight);
      }
      break;
    }

    case 'electric': {
      ctx.fillStyle = '#08051E';
      ctx.fillRect(0, 0, w, h);

      // Plasma Core Glows
      const pGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, isPreview ? 80 : 180);
      pGrad.addColorStop(0, 'rgba(162, 155, 254, 0.35)');
      pGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, w, h);

      // Branching lightning arcs
      ctx.strokeStyle = '#70A1FF';
      ctx.shadowColor = '#A29BFE';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;

      ctx.beginPath();
      let curX = w * 0.2;
      let curY = h * 0.2;
      ctx.moveTo(curX, curY);

      for (let i = 0; i < 8; i++) {
        curX += (w * 0.6) / 8 + (Math.sin(t * 15 + i) * 20);
        curY += (h * 0.6) / 8 + (Math.cos(t * 18 + i) * 25);
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }

    case 'particles': {
      ctx.fillStyle = '#0A0F17';
      ctx.fillRect(0, 0, w, h);

      const maxDist = isPreview ? 45 : 85;

      // Update and connect particles
      for (let i = 0; i < state.particles.length; i++) {
        const p1 = state.particles[i];
        p1.x += p1.vx * dt;
        p1.y += p1.vy * dt;

        if (p1.x < 0 || p1.x > w) p1.vx *= -1;
        if (p1.y < 0 || p1.y > h) p1.vy *= -1;

        // Draw connections
        for (let j = i + 1; j < state.particles.length; j++) {
          const p2 = state.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.strokeStyle = `rgba(255, 234, 167, ${(1 - dist / maxDist) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();
      }
      break;
    }

    case 'liquid_metal': {
      ctx.fillStyle = '#111419';
      ctx.fillRect(0, 0, w, h);

      // Undulating liquid chrome ripples
      for (let i = 0; i < 5; i++) {
        const y = h * (0.2 + i * 0.16) + Math.sin(t * 0.6 + i) * 25;
        const grad = ctx.createLinearGradient(0, y - 30, 0, y + 30);
        grad.addColorStop(0, 'rgba(223, 230, 233, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
        grad.addColorStop(1, 'rgba(178, 190, 195, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.015 + t * 0.8 + i) * 20);
        }
        ctx.lineTo(w, y + 40);
        ctx.lineTo(0, y + 40);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'hologram': {
      ctx.fillStyle = '#03141F';
      ctx.fillRect(0, 0, w, h);

      // Sweeping holographic scanline
      const scanY = (t * 70) % (h + 40) - 20;
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, 'rgba(85, 239, 196, 0)');
      scanGrad.addColorStop(0.5, 'rgba(85, 239, 196, 0.4)');
      scanGrad.addColorStop(1, 'rgba(85, 239, 196, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, w, 40);

      // Subtle holographic grid
      ctx.strokeStyle = 'rgba(129, 236, 236, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      break;
    }

    case 'black_hole': {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;

      // Swirling golden accretion disk
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.42);
      ctx.rotate(t * 0.4);

      const diskGrad = ctx.createRadialGradient(0, 0, isPreview ? 25 : 55, 0, 0, isPreview ? 70 : 160);
      diskGrad.addColorStop(0, '#FFAA00');
      diskGrad.addColorStop(0.4, '#E17055');
      diskGrad.addColorStop(0.8, '#FAB1A0');
      diskGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.arc(0, 0, isPreview ? 70 : 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Pitch Black Event Horizon Singularity
      ctx.beginPath();
      ctx.arc(cx, cy, isPreview ? 22 : 50, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Photon sphere glow
      ctx.strokeStyle = '#FFAA00';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFAA00';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }

    case 'lava_lamp': {
      ctx.fillStyle = '#1C0620';
      ctx.fillRect(0, 0, w, h);

      for (let blob of state.blobs) {
        blob.y += blob.vy * dt;
        if (blob.y < blob.radius || blob.y > h - blob.radius) {
          blob.vy *= -1;
        }

        const bGrad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        bGrad.addColorStop(0, blob.color);
        bGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'clouds': {
      ctx.fillStyle = '#101B2E';
      ctx.fillRect(0, 0, w, h);

      // Moon glow
      const moonGrad = ctx.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, 80);
      moonGrad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
      moonGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(w * 0.8 - 80, h * 0.2 - 80, 160, 160);

      // Drifting clouds
      for (let c of state.clouds) {
        c.x += c.speed * dt;
        if (c.x > w + c.width) {
          c.x = -c.width;
          c.y = Math.random() * h * 0.8;
        }

        ctx.fillStyle = `rgba(129, 236, 236, ${c.opacity})`;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.width * 0.5, c.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default:
      break;
  }
}

// =========================================================================
// NATIVE ANIMATION ENGINE (iOS / Android Multi-Layered Glow & Particle Engine)
// =========================================================================

function NativeThemeEngine({ theme, isPreview }: { theme: ProfileTheme; isPreview: boolean }) {
  const loopAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(loopAnim, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [loopAnim]);

  const spin = loopAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const transX = loopAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-30, 30, -30] });
  const transY = loopAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [20, -20, 20] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Primary Glow Orb */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: isPreview ? 100 : 260,
          height: isPreview ? 100 : 260,
          borderRadius: 130,
          backgroundColor: theme.primaryColor,
          opacity: 0.25,
          transform: [{ translateX: transX }, { translateY: transY }, { rotate: spin }],
        }}
      />
      {/* Secondary Glow Orb */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '10%',
          width: isPreview ? 120 : 280,
          height: isPreview ? 120 : 280,
          borderRadius: 140,
          backgroundColor: theme.secondaryColor,
          opacity: 0.28,
          transform: [{ translateX: Animated.multiply(transX, -1) }, { rotate: spin }],
        }}
      />
      {/* Accent Light Core */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '45%',
          left: '30%',
          width: isPreview ? 80 : 200,
          height: isPreview ? 80 : 200,
          borderRadius: 100,
          backgroundColor: theme.accentColor,
          opacity: 0.2,
          transform: [{ scale: loopAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.2, 0.9] }) }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
