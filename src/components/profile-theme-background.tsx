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
    case 'halloween': {
      const emberCount = isPreview ? 14 : 32;
      const embers = Array.from({ length: emberCount }, () => ({
        x: Math.random() * w,
        y: h + Math.random() * 30,
        vx: (Math.random() - 0.5) * 16,
        vy: -(Math.random() * 30 + 20),
        size: Math.random() * 2.8 + 1.2,
        life: Math.random() * 3,
        maxLife: Math.random() * 2.5 + 2.5,
        color: Math.random() > 0.4 ? '#FF7700' : '#FFA500',
      }));

      const fogCount = isPreview ? 3 : 6;
      const fogs = Array.from({ length: fogCount }, (_, i) => ({
        x: Math.random() * w,
        y: h * (0.45 + (i / fogCount) * 0.5),
        radiusX: (isPreview ? 110 : 240) + Math.random() * 80,
        radiusY: (isPreview ? 35 : 70) + Math.random() * 30,
        speed: (i % 2 === 0 ? 1 : -1) * (12 + Math.random() * 10),
        opacity: 0.10 + Math.random() * 0.08,
      }));

      const batCount = isPreview ? 3 : 5;
      const bats = Array.from({ length: batCount }, (_, i) => ({
        x: -50 - Math.random() * 150 - i * 100,
        y: h * (0.12 + Math.random() * 0.35),
        vx: 45 + Math.random() * 35,
        vy: (Math.random() - 0.5) * 12,
        wingCycle: Math.random() * Math.PI * 2,
        size: isPreview ? 8 : 14 + Math.random() * 6,
      }));

      return { embers, fogs, bats };
    }
    case 'pumpkin_hollow': {
      const wispCount = isPreview ? 12 : 28;
      const wisps = Array.from({ length: wispCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 18,
        vy: -(Math.random() * 20 + 10),
        size: Math.random() * 3.2 + 1.2,
        life: Math.random() * 4,
        maxLife: Math.random() * 3 + 3,
        color: Math.random() > 0.45 ? '#00E676' : (Math.random() > 0.5 ? '#FF6D00' : '#A855F7'),
      }));

      const ghostCount = isPreview ? 2 : 4;
      const ghosts = Array.from({ length: ghostCount }, (_, i) => ({
        x: (w / (ghostCount + 1)) * (i + 1) + (Math.random() * 40 - 20),
        y: h * (0.28 + Math.random() * 0.35),
        baseY: h * (0.28 + Math.random() * 0.35),
        speed: (i % 2 === 0 ? 1 : -1) * (14 + Math.random() * 8),
        size: isPreview ? 18 : 28 + Math.random() * 10,
        bobPhase: Math.random() * Math.PI * 2,
        driftPhase: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.25,
      }));

      return { wisps, ghosts };
    }
    case 'cursed_crypt': {
      const ravenCount = isPreview ? 2 : 4;
      const ravens = Array.from({ length: ravenCount }, (_, i) => ({
        x: -40 - Math.random() * 180 - i * 120,
        y: h * (0.1 + Math.random() * 0.3),
        vx: 38 + Math.random() * 30,
        vy: (Math.random() - 0.5) * 10,
        wingCycle: Math.random() * Math.PI * 2,
        size: isPreview ? 7 : 12 + Math.random() * 5,
      }));

      const mistCount = isPreview ? 3 : 6;
      const mists = Array.from({ length: mistCount }, (_, i) => ({
        x: Math.random() * w,
        y: h * (0.55 + (i / mistCount) * 0.4),
        radiusX: (isPreview ? 100 : 220) + Math.random() * 80,
        radiusY: (isPreview ? 30 : 60) + Math.random() * 25,
        speed: (i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 8),
        opacity: 0.08 + Math.random() * 0.08,
      }));

      const fireflyCount = isPreview ? 6 : 14;
      const fireflies = Array.from({ length: fireflyCount }, () => ({
        x: Math.random() * w,
        y: h * (0.6 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 10,
        vy: -(Math.random() * 8 + 4),
        size: Math.random() * 2.2 + 0.8,
        life: Math.random() * 4,
        maxLife: Math.random() * 3 + 3,
      }));

      return {
        ravens,
        mists,
        fireflies,
        nextLightning: 4 + Math.random() * 6,
        lightningAlpha: 0,
      };
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

    case 'halloween': {
      // 1. Spooky Night Sky Background Gradient (Deep violet to midnight abyss)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0314');
      skyGrad.addColorStop(0.45, '#1e082f');
      skyGrad.addColorStop(0.85, '#12041d');
      skyGrad.addColorStop(1, '#08010d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Glowing Orange Moon with subtle rhythmic breathing pulse
      const moonX = w * 0.76;
      const moonY = isPreview ? h * 0.22 : h * 0.18;
      const moonBaseRadius = isPreview ? 26 : 46;
      const moonPulse = Math.sin(t * 1.5) * (isPreview ? 2 : 4);
      const moonRadius = moonBaseRadius + moonPulse;

      // Moon outer aura / corona glow
      const auraGrad = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 2.8);
      auraGrad.addColorStop(0, 'rgba(255, 120, 0, 0.45)');
      auraGrad.addColorStop(0.4, 'rgba(255, 80, 0, 0.22)');
      auraGrad.addColorStop(0.75, 'rgba(132, 34, 167, 0.18)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Moon Body Gradient
      const moonBodyGrad = ctx.createRadialGradient(moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.1, moonX, moonY, moonRadius);
      moonBodyGrad.addColorStop(0, '#FFF2AA');
      moonBodyGrad.addColorStop(0.4, '#FFA500');
      moonBodyGrad.addColorStop(0.85, '#FF6600');
      moonBodyGrad.addColorStop(1, '#CC3300');
      ctx.fillStyle = moonBodyGrad;
      ctx.shadowColor = '#FF7700';
      ctx.shadowBlur = isPreview ? 14 : 26;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Moon subtle crater shadows
      ctx.fillStyle = 'rgba(140, 30, 0, 0.22)';
      ctx.beginPath();
      ctx.arc(moonX - moonRadius * 0.25, moonY + moonRadius * 0.2, moonRadius * 0.22, 0, Math.PI * 2);
      ctx.arc(moonX + moonRadius * 0.3, moonY - moonRadius * 0.1, moonRadius * 0.18, 0, Math.PI * 2);
      ctx.arc(moonX + moonRadius * 0.1, moonY + moonRadius * 0.4, moonRadius * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // 3. Distant Spooky Haunted Castle Silhouette on rugged hill
      const castleBaseY = h * 0.72;
      const castleLeft = w * 0.10;
      const castleWidth = w * 0.42;

      ctx.fillStyle = '#06010a';
      ctx.beginPath();
      // Mountain base curve
      ctx.moveTo(0, h * 0.78);
      ctx.quadraticCurveTo(castleLeft + castleWidth * 0.5, castleBaseY, w, h * 0.76);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Castle Gothic Spired Silhouette
      ctx.beginPath();
      const cx = castleLeft + castleWidth * 0.2;
      const ch = isPreview ? 35 : 75;

      // Main Keep
      ctx.rect(cx + castleWidth * 0.18, castleBaseY - ch * 0.65, castleWidth * 0.26, ch * 0.65);
      // Tall central tower with needle spire
      ctx.moveTo(cx + castleWidth * 0.24, castleBaseY - ch * 0.65);
      ctx.lineTo(cx + castleWidth * 0.31, castleBaseY - ch * 1.05);
      ctx.lineTo(cx + castleWidth * 0.38, castleBaseY - ch * 0.65);
      // Left turret
      ctx.rect(cx + castleWidth * 0.04, castleBaseY - ch * 0.52, castleWidth * 0.14, ch * 0.52);
      ctx.moveTo(cx + castleWidth * 0.04, castleBaseY - ch * 0.52);
      ctx.lineTo(cx + castleWidth * 0.11, castleBaseY - ch * 0.85);
      ctx.lineTo(cx + castleWidth * 0.18, castleBaseY - ch * 0.52);
      // Right turret
      ctx.rect(cx + castleWidth * 0.44, castleBaseY - ch * 0.48, castleWidth * 0.14, ch * 0.48);
      ctx.moveTo(cx + castleWidth * 0.44, castleBaseY - ch * 0.48);
      ctx.lineTo(cx + castleWidth * 0.51, castleBaseY - ch * 0.80);
      ctx.lineTo(cx + castleWidth * 0.58, castleBaseY - ch * 0.48);
      ctx.fill();

      // Castle Glowing Windows (Eerie candlelit yellow/orange flicker)
      const windowFlicker = 0.6 + Math.sin(t * 8) * 0.2 + Math.cos(t * 14) * 0.15;
      ctx.fillStyle = `rgba(255, 170, 0, ${windowFlicker})`;
      ctx.fillRect(cx + castleWidth * 0.28, castleBaseY - ch * 0.55, 3.5, 6);
      ctx.fillRect(cx + castleWidth * 0.10, castleBaseY - ch * 0.42, 2.5, 4.5);
      ctx.fillRect(cx + castleWidth * 0.48, castleBaseY - ch * 0.38, 2.5, 4.5);

      // 4. Moving Volumetric Fog Banks
      if (state.fogs) {
        for (let fog of state.fogs) {
          fog.x += fog.speed * dt;
          if (fog.x > w + fog.radiusX) {
            fog.x = -fog.radiusX;
          } else if (fog.x < -fog.radiusX) {
            fog.x = w + fog.radiusX;
          }

          const fogGrad = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.radiusX);
          fogGrad.addColorStop(0, `rgba(148, 64, 184, ${fog.opacity * 1.2})`);
          fogGrad.addColorStop(0.5, `rgba(100, 30, 140, ${fog.opacity * 0.7})`);
          fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = fogGrad;
          ctx.beginPath();
          ctx.save();
          ctx.translate(fog.x, fog.y);
          ctx.scale(1, fog.radiusY / fog.radiusX);
          ctx.arc(0, 0, fog.radiusX, 0, Math.PI * 2);
          ctx.restore();
          ctx.fill();
        }
      }

      // 5. Occasionally Flying Bats across the Night Sky
      if (state.bats) {
        for (let bat of state.bats) {
          bat.x += bat.vx * dt;
          bat.y += bat.vy * dt + Math.sin(t * 3 + bat.wingCycle) * 0.6;
          bat.wingCycle += dt * 14;

          // Recycle bat
          if (bat.x > w + 60) {
            bat.x = -60 - Math.random() * 80;
            bat.y = h * (0.10 + Math.random() * 0.42);
            bat.vx = 40 + Math.random() * 40;
          }

          const wingFlap = Math.sin(bat.wingCycle);
          const bs = bat.size;

          ctx.save();
          ctx.translate(bat.x, bat.y);
          ctx.fillStyle = '#08010e';

          // Bat Silhouette with flapping wings
          ctx.beginPath();
          // Head / Body
          ctx.arc(0, 0, bs * 0.22, 0, Math.PI * 2);
          // Left Wing
          ctx.moveTo(-bs * 0.1, 0);
          ctx.quadraticCurveTo(-bs * 0.6, wingFlap * bs * 0.7 - bs * 0.3, -bs * 1.0, wingFlap * bs * 0.4);
          ctx.quadraticCurveTo(-bs * 0.6, wingFlap * bs * 0.2 + bs * 0.2, -bs * 0.1, bs * 0.2);
          // Right Wing
          ctx.moveTo(bs * 0.1, 0);
          ctx.quadraticCurveTo(bs * 0.6, wingFlap * bs * 0.7 - bs * 0.3, bs * 1.0, wingFlap * bs * 0.4);
          ctx.quadraticCurveTo(bs * 0.6, wingFlap * bs * 0.2 + bs * 0.2, bs * 0.1, bs * 0.2);
          ctx.fill();

          // Bat subtle purple back-glow
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 6. Slowly Rising Orange Embers / Fireflies
      if (state.embers) {
        for (let ember of state.embers) {
          ember.y += ember.vy * dt;
          ember.x += ember.vx * dt + Math.sin(t * 2 + ember.life) * 0.8;
          ember.life += dt;

          if (ember.life >= ember.maxLife || ember.y < -10) {
            ember.x = Math.random() * w;
            ember.y = h + Math.random() * 20;
            ember.life = 0;
            ember.vy = -(Math.random() * 30 + 20);
          }

          const progress = ember.life / ember.maxLife;
          const alpha = progress < 0.2 ? progress / 0.2 : (1 - progress);

          ctx.fillStyle = ember.color;
          ctx.shadowColor = '#FF8800';
          ctx.shadowBlur = 6;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.beginPath();
          ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
      break;
    }

    case 'pumpkin_hollow': {
      // 1. Spooky Midnight Forest Sky with Emerald & Amethyst Twilight Mist
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#040d08');
      bgGrad.addColorStop(0.4, '#091c12');
      bgGrad.addColorStop(0.75, '#120a22');
      bgGrad.addColorStop(1, '#050a06');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Eerie Harvest Moon with Greenish-Amber Halo
      const moonX = w * 0.22;
      const moonY = isPreview ? h * 0.18 : h * 0.15;
      const moonRadius = isPreview ? 24 : 42;
      const pulseMoon = Math.sin(t * 1.8) * (isPreview ? 1.5 : 3);

      const moonAura = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 2.6);
      moonAura.addColorStop(0, 'rgba(0, 230, 118, 0.40)');
      moonAura.addColorStop(0.5, 'rgba(255, 109, 0, 0.20)');
      moonAura.addColorStop(0.8, 'rgba(156, 39, 176, 0.15)');
      moonAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonAura;
      ctx.beginPath();
      ctx.arc(moonX, moonY, (moonRadius + pulseMoon) * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Moon Body
      const moonBody = ctx.createRadialGradient(moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.1, moonX, moonY, moonRadius);
      moonBody.addColorStop(0, '#E8FFE8');
      moonBody.addColorStop(0.45, '#A7F3D0');
      moonBody.addColorStop(0.85, '#FFD166');
      moonBody.addColorStop(1, '#FF6D00');
      ctx.fillStyle = moonBody;
      ctx.shadowColor = '#00E676';
      ctx.shadowBlur = isPreview ? 12 : 22;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius + pulseMoon, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Spooky Twisted Tree Silhouettes at the sides
      ctx.fillStyle = '#030805';
      // Left gnarly branch
      ctx.beginPath();
      ctx.moveTo(0, h * 0.32);
      ctx.quadraticCurveTo(w * 0.12, h * 0.28, w * 0.18, h * 0.20);
      ctx.lineTo(w * 0.22, h * 0.21);
      ctx.quadraticCurveTo(w * 0.14, h * 0.30, 0, h * 0.38);
      ctx.fill();

      // Right hanging branch
      ctx.beginPath();
      ctx.moveTo(w, h * 0.25);
      ctx.quadraticCurveTo(w * 0.88, h * 0.22, w * 0.82, h * 0.14);
      ctx.lineTo(w * 0.78, h * 0.15);
      ctx.quadraticCurveTo(w * 0.86, h * 0.26, w, h * 0.32);
      ctx.fill();

      // Hanging Spiderweb on right branch
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.80, h * 0.15);
      ctx.lineTo(w * 0.80, h * 0.23);
      ctx.moveTo(w * 0.84, h * 0.18);
      ctx.lineTo(w * 0.84, h * 0.24);
      ctx.stroke();

      // 4. Ground Mound Silhouette (Spooky pumpkin patch hills)
      const hillBaseY = h * 0.82;
      ctx.fillStyle = '#040906';
      ctx.beginPath();
      ctx.moveTo(0, hillBaseY + (isPreview ? 10 : 20));
      ctx.quadraticCurveTo(w * 0.35, hillBaseY - 10, w * 0.65, hillBaseY + 5);
      ctx.quadraticCurveTo(w * 0.85, hillBaseY + 12, w, hillBaseY);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // 5. Glowing Jack-o'-Lantern Pumpkins at bottom
      const pumpkinCount = isPreview ? 2 : 4;
      const pumpkinWidths = [
        { x: w * 0.18, y: hillBaseY + (isPreview ? 12 : 24), size: isPreview ? 22 : 36, flickerSpeed: 7 },
        { x: w * 0.82, y: hillBaseY + (isPreview ? 10 : 20), size: isPreview ? 24 : 40, flickerSpeed: 9 },
        { x: w * 0.48, y: hillBaseY + (isPreview ? 18 : 34), size: isPreview ? 20 : 32, flickerSpeed: 6 },
        { x: w * 0.32, y: hillBaseY + (isPreview ? 22 : 42), size: isPreview ? 18 : 28, flickerSpeed: 11 },
      ];

      for (let pIdx = 0; pIdx < Math.min(pumpkinCount, pumpkinWidths.length); pIdx++) {
        const p = pumpkinWidths[pIdx];
        const px = p.x;
        const py = p.y;
        const ps = p.size;
        const flicker = 0.75 + Math.sin(t * p.flickerSpeed) * 0.18 + Math.cos(t * (p.flickerSpeed * 1.5)) * 0.08;

        // Pumpkin Body (Layered ribbed ovals)
        ctx.fillStyle = '#220b02';
        ctx.beginPath();
        ctx.ellipse(px, py, ps * 0.95, ps * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pumpkin Outer Glow
        const pGlow = ctx.createRadialGradient(px, py, ps * 0.1, px, py, ps * 1.6);
        pGlow.addColorStop(0, `rgba(255, 109, 0, ${0.45 * flicker})`);
        pGlow.addColorStop(0.5, `rgba(0, 230, 118, ${0.20 * flicker})`);
        pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(px, py, ps * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Pumpkin Stem
        ctx.fillStyle = '#112211';
        ctx.beginPath();
        ctx.rect(px - ps * 0.1, py - ps * 0.85, ps * 0.2, ps * 0.25);
        ctx.fill();

        // Pumpkin Face Features (Glowing Carved Eyes & Creepy Jagged Smile)
        ctx.fillStyle = `rgba(255, 170, 0, ${flicker})`;
        ctx.shadowColor = '#FF6D00';
        ctx.shadowBlur = isPreview ? 6 : 10;

        // Left Eye (Triangle)
        ctx.beginPath();
        ctx.moveTo(px - ps * 0.42, py - ps * 0.18);
        ctx.lineTo(px - ps * 0.18, py - ps * 0.18);
        ctx.lineTo(px - ps * 0.30, py - ps * 0.42);
        ctx.closePath();
        ctx.fill();

        // Right Eye (Triangle)
        ctx.beginPath();
        ctx.moveTo(px + ps * 0.18, py - ps * 0.18);
        ctx.lineTo(px + ps * 0.42, py - ps * 0.18);
        ctx.lineTo(px + ps * 0.30, py - ps * 0.42);
        ctx.closePath();
        ctx.fill();

        // Nose (Tiny inverted triangle)
        ctx.beginPath();
        ctx.moveTo(px, py - ps * 0.15);
        ctx.lineTo(px - ps * 0.08, py - ps * 0.02);
        ctx.lineTo(px + ps * 0.08, py - ps * 0.02);
        ctx.closePath();
        ctx.fill();

        // Sinister Jagged Smile
        ctx.beginPath();
        ctx.moveTo(px - ps * 0.55, py + ps * 0.12);
        ctx.lineTo(px - ps * 0.35, py + ps * 0.30);
        ctx.lineTo(px - ps * 0.20, py + ps * 0.18);
        ctx.lineTo(px, py + ps * 0.34);
        ctx.lineTo(px + ps * 0.20, py + ps * 0.18);
        ctx.lineTo(px + ps * 0.35, py + ps * 0.30);
        ctx.lineTo(px + ps * 0.55, py + ps * 0.12);
        ctx.lineTo(px + ps * 0.35, py + ps * 0.22);
        ctx.lineTo(px + ps * 0.18, py + ps * 0.10);
        ctx.lineTo(px, py + ps * 0.24);
        ctx.lineTo(px - ps * 0.18, py + ps * 0.10);
        ctx.lineTo(px - ps * 0.35, py + ps * 0.22);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      // 6. Floating Translucent Spectral Spirits / Ghosts
      if (state.ghosts) {
        for (let g of state.ghosts) {
          g.x += g.speed * dt;
          if (g.x > w + 60) {
            g.x = -60;
          } else if (g.x < -60) {
            g.x = w + 60;
          }

          const bob = Math.sin(t * 2 + g.bobPhase) * 12;
          const gy = g.baseY + bob;
          const gs = g.size;

          ctx.save();
          ctx.translate(g.x, gy);

          // Ethereal Ghost Glow
          const ghostGlow = ctx.createRadialGradient(0, 0, gs * 0.2, 0, 0, gs * 1.5);
          ghostGlow.addColorStop(0, `rgba(167, 243, 208, ${g.alpha * 0.6})`);
          ghostGlow.addColorStop(0.6, `rgba(0, 230, 118, ${g.alpha * 0.3})`);
          ghostGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = ghostGlow;
          ctx.beginPath();
          ctx.arc(0, 0, gs * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Ghost Spectral Body Path
          ctx.fillStyle = `rgba(235, 255, 245, ${g.alpha * 0.85})`;
          ctx.shadowColor = '#00E676';
          ctx.shadowBlur = isPreview ? 8 : 14;

          const wave = Math.sin(t * 4 + g.driftPhase) * (gs * 0.2);

          ctx.beginPath();
          // Head dome
          ctx.arc(0, -gs * 0.2, gs * 0.5, Math.PI, 0, false);
          // Right flowing body edge
          ctx.quadraticCurveTo(gs * 0.55, gs * 0.4, gs * 0.35 + wave, gs * 0.85);
          // Flowing jagged tail ripples
          ctx.quadraticCurveTo(gs * 0.15, gs * 0.65, 0, gs * 0.85 - wave);
          ctx.quadraticCurveTo(-gs * 0.15, gs * 0.65, -gs * 0.35 - wave, gs * 0.85);
          // Left flowing body edge
          ctx.quadraticCurveTo(-gs * 0.55, gs * 0.4, -gs * 0.5, -gs * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          // Ghost Eerie Eyes
          ctx.fillStyle = '#061a0f';
          ctx.beginPath();
          ctx.ellipse(-gs * 0.18, -gs * 0.22, gs * 0.09, gs * 0.14, -0.1, 0, Math.PI * 2);
          ctx.ellipse(gs * 0.18, -gs * 0.22, gs * 0.09, gs * 0.14, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Cute spooky tiny open mouth
          ctx.beginPath();
          ctx.ellipse(0, -gs * 0.05, gs * 0.07, gs * 0.10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // 7. Swirling Witching Fireflies & Emerald Wisps
      if (state.wisps) {
        for (let wisp of state.wisps) {
          wisp.y += wisp.vy * dt;
          wisp.x += wisp.vx * dt + Math.sin(t * 2.5 + wisp.life) * 1.2;
          wisp.life += dt;

          if (wisp.life >= wisp.maxLife || wisp.y < -10) {
            wisp.x = Math.random() * w;
            wisp.y = h + Math.random() * 20;
            wisp.life = 0;
            wisp.vy = -(Math.random() * 20 + 10);
          }

          const progress = wisp.life / wisp.maxLife;
          const alpha = progress < 0.2 ? progress / 0.2 : (1 - progress);

          ctx.fillStyle = wisp.color;
          ctx.shadowColor = wisp.color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.beginPath();
          ctx.arc(wisp.x, wisp.y, wisp.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
      break;
    }

    case 'cursed_crypt': {
      // 1. Deep Void Night Sky with Crimson-Violet Haze
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#05030A');
      bgGrad.addColorStop(0.45, '#140414');
      bgGrad.addColorStop(0.75, '#1C0710');
      bgGrad.addColorStop(1, '#030205');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Twinkling distant stars
      ctx.fillStyle = 'rgba(214, 179, 255, 0.5)';
      for (let i = 0; i < (isPreview ? 10 : 24); i++) {
        const sx = (i * 97.3) % w;
        const sy = (i * 53.7) % (h * 0.5);
        const tw = 0.4 + Math.abs(Math.sin(t * 2 + i)) * 0.6;
        ctx.globalAlpha = tw;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.globalAlpha = 1.0;

      // 2. Blood-Red Full Moon with Pulsing Crimson Halo
      const moonX = w * 0.78;
      const moonY = isPreview ? h * 0.16 : h * 0.14;
      const moonRadius = isPreview ? 22 : 38;
      const pulseMoon = Math.sin(t * 1.5) * (isPreview ? 1.2 : 2.5);

      const moonAura = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 2.8);
      moonAura.addColorStop(0, 'rgba(229, 57, 53, 0.42)');
      moonAura.addColorStop(0.5, 'rgba(176, 38, 255, 0.18)');
      moonAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonAura;
      ctx.beginPath();
      ctx.arc(moonX, moonY, (moonRadius + pulseMoon) * 2.8, 0, Math.PI * 2);
      ctx.fill();

      const moonBody = ctx.createRadialGradient(moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.1, moonX, moonY, moonRadius);
      moonBody.addColorStop(0, '#FFD9D4');
      moonBody.addColorStop(0.45, '#F28B82');
      moonBody.addColorStop(0.85, '#E53935');
      moonBody.addColorStop(1, '#8E1A17');
      ctx.fillStyle = moonBody;
      ctx.shadowColor = '#E53935';
      ctx.shadowBlur = isPreview ? 10 : 20;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius + pulseMoon, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Jagged Dead Tree Silhouettes
      ctx.fillStyle = '#020103';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.46);
      ctx.lineTo(w * 0.04, h * 0.30);
      ctx.lineTo(w * 0.06, h * 0.34);
      ctx.lineTo(w * 0.09, h * 0.18);
      ctx.lineTo(w * 0.105, h * 0.22);
      ctx.lineTo(w * 0.13, h * 0.12);
      ctx.lineTo(w * 0.14, h * 0.26);
      ctx.lineTo(w * 0.18, h * 0.32);
      ctx.lineTo(w * 0.16, h * 0.44);
      ctx.lineTo(0, h * 0.52);
      ctx.closePath();
      ctx.fill();

      // 4. Crooked Graveyard Hill Silhouette
      const hillBaseY = h * 0.80;
      ctx.fillStyle = '#060308';
      ctx.beginPath();
      ctx.moveTo(0, hillBaseY + (isPreview ? 12 : 22));
      ctx.quadraticCurveTo(w * 0.3, hillBaseY - 14, w * 0.55, hillBaseY + 6);
      ctx.quadraticCurveTo(w * 0.8, hillBaseY + 16, w, hillBaseY + 2);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // 5. Crumbling Tombstones with Flickering Candle Flames
      const stoneCount = isPreview ? 2 : 4;
      const stones = [
        { x: w * 0.16, y: hillBaseY + (isPreview ? 6 : 10), w: isPreview ? 14 : 22, h: isPreview ? 22 : 36, flickerSpeed: 8, tilt: -0.05 },
        { x: w * 0.42, y: hillBaseY + (isPreview ? 10 : 18), w: isPreview ? 16 : 26, h: isPreview ? 26 : 42, flickerSpeed: 6, tilt: 0.08 },
        { x: w * 0.65, y: hillBaseY + (isPreview ? 4 : 8), w: isPreview ? 13 : 20, h: isPreview ? 20 : 32, flickerSpeed: 10, tilt: -0.1 },
        { x: w * 0.88, y: hillBaseY + (isPreview ? 12 : 20), w: isPreview ? 15 : 24, h: isPreview ? 24 : 38, flickerSpeed: 7, tilt: 0.04 },
      ];

      for (let sIdx = 0; sIdx < Math.min(stoneCount, stones.length); sIdx++) {
        const s = stones[sIdx];
        const flicker = 0.7 + Math.sin(t * s.flickerSpeed) * 0.2 + Math.cos(t * (s.flickerSpeed * 1.3)) * 0.1;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.tilt);

        // Tombstone body
        ctx.fillStyle = '#141018';
        ctx.beginPath();
        ctx.moveTo(-s.w / 2, 0);
        ctx.lineTo(-s.w / 2, -s.h * 0.55);
        ctx.quadraticCurveTo(-s.w / 2, -s.h, 0, -s.h);
        ctx.quadraticCurveTo(s.w / 2, -s.h, s.w / 2, -s.h * 0.55);
        ctx.lineTo(s.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(229, 57, 53, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cracked rune carving
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(-s.w * 0.2, -s.h * 0.3);
        ctx.lineTo(s.w * 0.2, -s.h * 0.6);
        ctx.stroke();

        // Flickering candle flame on top
        const flameGlow = ctx.createRadialGradient(0, -s.h - 4, 0, 0, -s.h - 4, 14 * flicker);
        flameGlow.addColorStop(0, `rgba(176, 38, 255, ${0.55 * flicker})`);
        flameGlow.addColorStop(0.6, `rgba(229, 57, 53, ${0.22 * flicker})`);
        flameGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(0, -s.h - 4, 14 * flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(214, 179, 255, ${flicker})`;
        ctx.beginPath();
        ctx.moveTo(0, -s.h - 10 * flicker);
        ctx.quadraticCurveTo(3, -s.h - 4, 0, -s.h);
        ctx.quadraticCurveTo(-3, -s.h - 4, 0, -s.h - 10 * flicker);
        ctx.fill();

        ctx.restore();
      }

      // 6. Crawling Cursed Green Mist / Fog Banks
      if (state.mists) {
        for (let mist of state.mists) {
          mist.x += mist.speed * dt;
          if (mist.x > w + mist.radiusX) mist.x = -mist.radiusX;
          if (mist.x < -mist.radiusX) mist.x = w + mist.radiusX;

          const mistGrad = ctx.createRadialGradient(mist.x, mist.y, 0, mist.x, mist.y, mist.radiusX);
          mistGrad.addColorStop(0, `rgba(57, 255, 136, ${mist.opacity})`);
          mistGrad.addColorStop(1, 'rgba(57, 255, 136, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.ellipse(mist.x, mist.y, mist.radiusX, mist.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Circling Ravens Flying Across the Sky
      if (state.ravens) {
        for (let raven of state.ravens) {
          raven.x += raven.vx * dt;
          raven.y += Math.sin(t * 2 + raven.wingCycle) * 0.3;
          raven.wingCycle += dt * 9;

          if (raven.x > w + 50) {
            raven.x = -50 - Math.random() * 100;
            raven.y = h * (0.08 + Math.random() * 0.3);
          }

          const flap = Math.sin(raven.wingCycle) * raven.size * 0.7;
          ctx.strokeStyle = '#0A0A0D';
          ctx.lineWidth = Math.max(1.5, raven.size * 0.14);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(raven.x - raven.size, raven.y - flap);
          ctx.quadraticCurveTo(raven.x, raven.y - raven.size * 0.3, raven.x, raven.y);
          ctx.quadraticCurveTo(raven.x, raven.y - raven.size * 0.3, raven.x + raven.size, raven.y - flap);
          ctx.stroke();
        }
      }

      // 8. Rising Cursed Will-o'-Wisp Fireflies
      if (state.fireflies) {
        for (let f of state.fireflies) {
          f.y += f.vy * dt;
          f.x += f.vx * dt + Math.sin(t * 3 + f.life) * 0.8;
          f.life += dt;

          if (f.life >= f.maxLife || f.y < h * 0.3) {
            f.x = Math.random() * w;
            f.y = h * (0.75 + Math.random() * 0.2);
            f.life = 0;
          }

          const progress = f.life / f.maxLife;
          const alpha = progress < 0.2 ? progress / 0.2 : (1 - progress);
          const color = Math.sin(f.life * 3) > 0 ? '#39FF88' : '#B026FF';

          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 7;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // 9. Rare Flickering Lightning Flash on the Horizon
      if (typeof state.nextLightning === 'number') {
        state.nextLightning -= dt;
        if (state.nextLightning <= 0) {
          state.lightningAlpha = 0.28 + Math.random() * 0.15;
          state.nextLightning = 5 + Math.random() * 8;
        }
        if (state.lightningAlpha > 0) {
          ctx.fillStyle = `rgba(176, 38, 255, ${state.lightningAlpha})`;
          ctx.fillRect(0, 0, w, h * 0.7);
          state.lightningAlpha -= dt * 1.6;
          if (state.lightningAlpha < 0) state.lightningAlpha = 0;
        }
      }
      break;
    }

    default:
      break;
  }
}

// =========================================================================
// NATIVE ANIMATION ENGINE (iOS / Android High-Performance Renderers)
// =========================================================================

function NativeThemeEngine({ theme, isPreview }: { theme: ProfileTheme; isPreview: boolean }) {
  switch (theme.id) {
    case 'matrix':
      return <NativeMatrixAnimation isPreview={isPreview} />;
    case 'cyberpunk':
      return <NativeCyberpunkAnimation isPreview={isPreview} />;
    case 'aurora':
      return <NativeAuroraAnimation isPreview={isPreview} />;
    case 'starfield':
      return <NativeStarfieldAnimation isPreview={isPreview} />;
    case 'nebula':
      return <NativeNebulaAnimation isPreview={isPreview} />;
    case 'ocean':
      return <NativeOceanAnimation isPreview={isPreview} />;
    case 'rainy_window':
      return <NativeRainyWindowAnimation isPreview={isPreview} />;
    case 'fire':
      return <NativeFireAnimation isPreview={isPreview} />;
    case 'snowfall':
      return <NativeSnowfallAnimation isPreview={isPreview} />;
    case 'cherry_blossom':
      return <NativeCherryBlossomAnimation isPreview={isPreview} />;
    case 'galaxy':
      return <NativeGalaxyAnimation isPreview={isPreview} />;
    case 'vaporwave':
      return <NativeVaporwaveAnimation isPreview={isPreview} />;
    case 'glitch':
      return <NativeGlitchAnimation isPreview={isPreview} />;
    case 'electric':
      return <NativeElectricAnimation isPreview={isPreview} />;
    case 'particles':
      return <NativeParticlesAnimation isPreview={isPreview} />;
    case 'liquid_metal':
      return <NativeLiquidMetalAnimation isPreview={isPreview} />;
    case 'hologram':
      return <NativeHologramAnimation isPreview={isPreview} />;
    case 'black_hole':
      return <NativeBlackHoleAnimation isPreview={isPreview} />;
    case 'lava_lamp':
      return <NativeLavaLampAnimation isPreview={isPreview} />;
    case 'clouds':
      return <NativeCloudsAnimation isPreview={isPreview} />;
    case 'halloween':
      return <NativeHalloweenAnimation isPreview={isPreview} />;
    case 'pumpkin_hollow':
      return <NativePumpkinHollowAnimation isPreview={isPreview} />;
    case 'cursed_crypt':
      return <NativeCursedCryptAnimation isPreview={isPreview} />;
    default:
      return null;
  }
}

// -------------------------------------------------------------
// 1. Native Matrix
// -------------------------------------------------------------
const MATRIX_CHARS_LIST = '01アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロ0123456789ABCDEF$#@%&*';

function NativeMatrixAnimation({ isPreview }: { isPreview: boolean }) {
  const columnCount = isPreview ? 7 : 15;
  const columns = useMemo(() => {
    return Array.from({ length: columnCount }, (_, i) => {
      const charCount = isPreview ? 10 : 20;
      const text = Array.from({ length: charCount }, () =>
        MATRIX_CHARS_LIST[Math.floor(Math.random() * MATRIX_CHARS_LIST.length)]
      ).join('\n');
      return {
        id: i,
        leftPercent: (i / columnCount) * 100 + (Math.random() * 3 - 1.5),
        duration: 9000 + Math.random() * 8000,
        delay: Math.random() * 5000,
        opacity: 0.35 + Math.random() * 0.45,
        fontSize: isPreview ? 9 : 12,
        text,
      };
    });
  }, [columnCount, isPreview]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {columns.map((col) => (
        <NativeMatrixCol key={col.id} col={col} />
      ))}
    </View>
  );
}

function NativeMatrixCol({ col }: { col: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(col.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: col.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, col]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 750],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${col.leftPercent}%`,
        color: '#00FF66',
        fontSize: col.fontSize,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        lineHeight: col.fontSize * 1.35,
        opacity: col.opacity,
        transform: [{ translateY }],
        textShadowColor: '#00FF66',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      }}
    >
      {col.text}
    </Animated.Text>
  );
}

// -------------------------------------------------------------
// 2. Native Cyberpunk
// -------------------------------------------------------------
function NativeCyberpunkAnimation({ isPreview }: { isPreview: boolean }) {
  const beam1 = useRef(new Animated.Value(0)).current;
  const beam2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(beam1, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(beam2, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    pulseLoop.start();
    return () => {
      loop1.stop();
      loop2.stop();
      pulseLoop.stop();
    };
  }, [beam1, beam2, pulse]);

  const beam1X = beam1.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, SCREEN_WIDTH + 200],
  });
  const beam2X = beam2.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH + 200, -200],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Background Skyline Silhouettes */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: isPreview ? 60 : 140,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          opacity: 0.45,
        }}
      >
        <View style={{ width: '18%', height: '80%', backgroundColor: '#130924', borderTopColor: '#00F0FF', borderTopWidth: 1.5 }} />
        <View style={{ width: '22%', height: '100%', backgroundColor: '#1A0D30', borderTopColor: '#FF007F', borderTopWidth: 1.5 }} />
        <View style={{ width: '15%', height: '60%', backgroundColor: '#110820', borderTopColor: '#00F0FF', borderTopWidth: 1.5 }} />
        <View style={{ width: '25%', height: '90%', backgroundColor: '#1D0F35', borderTopColor: '#FFE600', borderTopWidth: 1.5 }} />
        <View style={{ width: '14%', height: '70%', backgroundColor: '#150A26', borderTopColor: '#FF007F', borderTopWidth: 1.5 }} />
      </View>

      {/* Neon Light Beams */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '25%' : '35%',
          width: isPreview ? 90 : 200,
          height: 3,
          backgroundColor: '#00F0FF',
          shadowColor: '#00F0FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 10,
          transform: [{ translateX: beam1X }, { rotate: '-14deg' }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '55%' : '65%',
          width: isPreview ? 110 : 240,
          height: 3,
          backgroundColor: '#FF007F',
          shadowColor: '#FF007F',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 12,
          transform: [{ translateX: beam2X }, { rotate: '10deg' }],
        }}
      />

      {/* Ambient Neon Glow Orbs */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: isPreview ? 100 : 220,
          height: isPreview ? 100 : 220,
          borderRadius: 110,
          backgroundColor: '#00F0FF',
          opacity: glowOpacity,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: isPreview ? 120 : 250,
          height: isPreview ? 120 : 250,
          borderRadius: 125,
          backgroundColor: '#FF007F',
          opacity: glowOpacity,
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 3. Native Aurora
// -------------------------------------------------------------
function NativeAuroraAnimation({ isPreview }: { isPreview: boolean }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave1, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave2, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 0,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(wave3, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();
    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [wave1, wave2, wave3]);

  const transX1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const transY1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [-20, 25] });
  const transX2 = wave2.interpolate({ inputRange: [0, 1], outputRange: [35, -35] });
  const transX3 = wave3.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Aurora Layer 1 - Emerald Green */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? -30 : -60,
          left: '-20%',
          width: '140%',
          height: isPreview ? 150 : 340,
          borderRadius: 170,
          backgroundColor: '#00FFC2',
          opacity: 0.22,
          transform: [{ translateX: transX1 }, { translateY: transY1 }, { rotate: '-16deg' }, { scaleY: 0.65 }],
        }}
      />
      {/* Aurora Layer 2 - Cyan / Teal */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? 20 : 80,
          left: '-15%',
          width: '130%',
          height: isPreview ? 130 : 300,
          borderRadius: 150,
          backgroundColor: '#00E5FF',
          opacity: 0.18,
          transform: [{ translateX: transX2 }, { rotate: '12deg' }, { scaleY: 0.55 }],
        }}
      />
      {/* Aurora Layer 3 - Violet / Purple */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? 60 : 160,
          left: '-25%',
          width: '150%',
          height: isPreview ? 160 : 360,
          borderRadius: 180,
          backgroundColor: '#8A2BE2',
          opacity: 0.2,
          transform: [{ translateX: transX3 }, { rotate: '-8deg' }, { scaleY: 0.7 }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 4. Native Starfield
// -------------------------------------------------------------
function NativeStarfieldAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 25 : 55;
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1.2,
      duration: 2500 + Math.random() * 3500,
      delay: Math.random() * 3000,
      color: Math.random() > 0.3 ? '#FFFFFF' : Math.random() > 0.5 ? '#70A1FF' : '#ECCC68',
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star) => (
        <NativeTwinkleStar key={star.id} star={star} />
      ))}
    </View>
  );
}

function NativeTwinkleStar({ star }: { star: any }) {
  const anim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: star.duration * 0.5,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.15,
          duration: star.duration * 0.5,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, star]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${star.left}%`,
        top: `${star.top}%`,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: star.color,
        opacity: anim,
        shadowColor: star.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      }}
    />
  );
}

// -------------------------------------------------------------
// 5. Native Nebula
// -------------------------------------------------------------
function NativeNebulaAnimation({ isPreview }: { isPreview: boolean }) {
  const rot1 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotLoop = Animated.loop(
      Animated.timing(rot1, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    rotLoop.start();
    pulseLoop.start();
    return () => {
      rotLoop.stop();
      pulseLoop.stop();
    };
  }, [rot1, pulse]);

  const spin = rot1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: isPreview ? 140 : 320,
          height: isPreview ? 140 : 320,
          borderRadius: 160,
          backgroundColor: '#6C5CE7',
          opacity: 0.22,
          transform: [{ rotate: spin }, { scale }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: '35%',
          right: '5%',
          width: isPreview ? 130 : 300,
          height: isPreview ? 130 : 300,
          borderRadius: 150,
          backgroundColor: '#FD79A8',
          opacity: 0.18,
          transform: [{ rotate: spin }, { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.95] }) }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: isPreview ? 120 : 260,
          height: isPreview ? 120 : 260,
          borderRadius: 130,
          backgroundColor: '#00CEC9',
          opacity: 0.16,
          transform: [{ scale }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 6. Native Ocean
// -------------------------------------------------------------
function NativeOceanAnimation({ isPreview }: { isPreview: boolean }) {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim1, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim2, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim2, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [waveAnim1, waveAnim2]);

  const x1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [-25, 25] });
  const y1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
  const x2 = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, -20] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: isPreview ? -20 : -40,
          left: '-20%',
          width: '140%',
          height: isPreview ? 100 : 220,
          borderRadius: 110,
          backgroundColor: '#0984E3',
          opacity: 0.28,
          transform: [{ translateX: x1 }, { translateY: y1 }, { scaleY: 0.6 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: isPreview ? 20 : 60,
          left: '-15%',
          width: '130%',
          height: isPreview ? 90 : 200,
          borderRadius: 100,
          backgroundColor: '#00CEC9',
          opacity: 0.2,
          transform: [{ translateX: x2 }, { scaleY: 0.5 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
          width: isPreview ? 80 : 180,
          height: isPreview ? 80 : 180,
          borderRadius: 90,
          backgroundColor: '#74B9FF',
          opacity: 0.15,
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 7. Native Rainy Window
// -------------------------------------------------------------
function NativeRainyWindowAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 16 : 40;
  const drops = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      length: Math.random() * 25 + 12,
      duration: 700 + Math.random() * 900,
      delay: Math.random() * 2000,
      opacity: 0.3 + Math.random() * 0.45,
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Warm Bokeh circles */}
      <View
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: isPreview ? 60 : 140,
          height: isPreview ? 60 : 140,
          borderRadius: 70,
          backgroundColor: 'rgba(243, 156, 18, 0.12)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '20%',
          width: isPreview ? 70 : 160,
          height: isPreview ? 70 : 160,
          borderRadius: 80,
          backgroundColor: 'rgba(52, 152, 219, 0.12)',
        }}
      />

      {drops.map((drop) => (
        <NativeRainDrop key={drop.id} drop={drop} />
      ))}
    </View>
  );
}

function NativeRainDrop({ drop }: { drop: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(drop.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: drop.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, drop]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 750],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${drop.left}%`,
        width: 1.5,
        height: drop.length,
        backgroundColor: 'rgba(180, 210, 240, 0.8)',
        opacity: drop.opacity,
        transform: [{ translateY }, { rotate: '8deg' }],
      }}
    />
  );
}

// -------------------------------------------------------------
// 8. Native Fire
// -------------------------------------------------------------
function NativeFireAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 15 : 35;
  const embers = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: 30 + Math.random() * 40,
      driftX: (Math.random() - 0.5) * 60,
      size: Math.random() * 5 + 3,
      duration: 2000 + Math.random() * 2500,
      delay: Math.random() * 3000,
      color: Math.random() > 0.6 ? '#FFAA00' : Math.random() > 0.3 ? '#FF7675' : '#FFEAA7',
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Flame Base Glow */}
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          left: '10%',
          right: '10%',
          height: isPreview ? 80 : 180,
          borderRadius: 90,
          backgroundColor: '#FF4500',
          opacity: 0.25,
        }}
      />
      {embers.map((ember) => (
        <NativeFireEmber key={ember.id} ember={ember} />
      ))}
    </View>
  );
}

function NativeFireEmber({ ember }: { ember: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(ember.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: ember.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, ember]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 100],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, ember.driftX, ember.driftX * 1.5],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.9, 0.6, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${ember.startX}%`,
        width: ember.size,
        height: ember.size,
        borderRadius: ember.size / 2,
        backgroundColor: ember.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: ember.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
      }}
    />
  );
}

// -------------------------------------------------------------
// 9. Native Snowfall
// -------------------------------------------------------------
function NativeSnowfallAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 18 : 45;
  const flakes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      sway: Math.random() * 30 + 10,
      duration: 5000 + Math.random() * 6000,
      delay: Math.random() * 5000,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {flakes.map((flake) => (
        <NativeSnowflake key={flake.id} flake={flake} />
      ))}
    </View>
  );
}

function NativeSnowflake({ flake }: { flake: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(flake.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: flake.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, flake]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 750],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, flake.sway, 0, -flake.sway, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${flake.left}%`,
        width: flake.size,
        height: flake.size,
        borderRadius: flake.size / 2,
        backgroundColor: '#FFFFFF',
        opacity: flake.opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

// -------------------------------------------------------------
// 10. Native Cherry Blossom
// -------------------------------------------------------------
function NativeCherryBlossomAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 14 : 35;
  const petals = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 7 + 6,
      duration: 6000 + Math.random() * 7000,
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? '#FFB7B2' : '#FFCCD5',
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {petals.map((petal) => (
        <NativePetal key={petal.id} petal={petal} />
      ))}
    </View>
  );
}

function NativePetal({ petal }: { petal: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(petal.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: petal.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, petal]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 750] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '420deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${petal.left}%`,
        width: petal.size,
        height: petal.size * 1.5,
        borderRadius: petal.size,
        backgroundColor: petal.color,
        opacity: 0.65,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

// -------------------------------------------------------------
// 11. Native Galaxy
// -------------------------------------------------------------
function NativeGalaxyAnimation({ isPreview }: { isPreview: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reverseRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {/* Galaxy Core */}
      <View
        style={{
          width: isPreview ? 70 : 160,
          height: isPreview ? 70 : 160,
          borderRadius: 80,
          backgroundColor: '#FD79A8',
          opacity: 0.35,
        }}
      />
      {/* Spiral Arm 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: isPreview ? 140 : 320,
          height: isPreview ? 60 : 140,
          borderRadius: 70,
          borderColor: 'rgba(108, 92, 231, 0.4)',
          borderWidth: 2,
          transform: [{ rotate }, { scaleX: 1.2 }],
        }}
      />
      {/* Spiral Arm 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: isPreview ? 160 : 360,
          height: isPreview ? 70 : 160,
          borderRadius: 80,
          borderColor: 'rgba(0, 206, 201, 0.35)',
          borderWidth: 2,
          transform: [{ rotate: reverseRotate }, { scaleX: 1.3 }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 12. Native Vaporwave
// -------------------------------------------------------------
function NativeVaporwaveAnimation({ isPreview }: { isPreview: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const sunScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Synthwave Sun */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '18%' : '22%',
          alignSelf: 'center',
          width: isPreview ? 90 : 200,
          height: isPreview ? 90 : 200,
          borderRadius: 100,
          backgroundColor: '#FF007F',
          opacity: 0.65,
          transform: [{ scale: sunScale }],
          shadowColor: '#FFE600',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
        }}
      />

      {/* Horizon Neon Line */}
      <View
        style={{
          position: 'absolute',
          top: isPreview ? '52%' : '56%',
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: '#00F0FF',
          shadowColor: '#00F0FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
        }}
      />

      {/* Retro Grid Perspective Base */}
      <View
        style={{
          position: 'absolute',
          top: isPreview ? '52%' : '56%',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopColor: '#FF007F',
          borderTopWidth: 1,
          opacity: 0.35,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <View style={{ width: 1, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '-25deg' }] }} />
          <View style={{ width: 1, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '-12deg' }] }} />
          <View style={{ width: 1, height: '100%', backgroundColor: '#00F0FF' }} />
          <View style={{ width: 1, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '12deg' }] }} />
          <View style={{ width: 1, height: '100%', backgroundColor: '#00F0FF', transform: [{ rotate: '25deg' }] }} />
        </View>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// 13. Native Glitch
// -------------------------------------------------------------
function NativeGlitchAnimation({ isPreview }: { isPreview: boolean }) {
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(shift, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shift, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.delay(3500),
        Animated.timing(shift, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 80, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shift]);

  const transXCyan = shift.interpolate({ inputRange: [-1, 0, 1], outputRange: [-15, 0, 15] });
  const transXMag = shift.interpolate({ inputRange: [-1, 0, 1], outputRange: [15, 0, -15] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Glitch Block 1 (Cyan Shift) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          right: '25%',
          height: isPreview ? 20 : 45,
          backgroundColor: 'rgba(0, 240, 255, 0.25)',
          transform: [{ translateX: transXCyan }],
        }}
      />
      {/* Glitch Block 2 (Magenta Shift) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '60%',
          left: '20%',
          right: '15%',
          height: isPreview ? 25 : 55,
          backgroundColor: 'rgba(255, 0, 127, 0.22)',
          transform: [{ translateX: transXMag }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 14. Native Electric
// -------------------------------------------------------------
function NativeElectricAnimation({ isPreview }: { isPreview: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale1 = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const scale2 = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.85] });

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View
        style={{
          width: isPreview ? 100 : 240,
          height: isPreview ? 100 : 240,
          borderRadius: 120,
          borderWidth: 2,
          borderColor: '#00F2FE',
          opacity: 0.45,
          transform: [{ scale: scale1 }],
          shadowColor: '#00F2FE',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 10,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: isPreview ? 140 : 300,
          height: isPreview ? 140 : 300,
          borderRadius: 150,
          borderWidth: 1.5,
          borderColor: '#4FACFE',
          opacity: 0.35,
          transform: [{ scale: scale2 }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 15. Native Particles
// -------------------------------------------------------------
function NativeParticlesAnimation({ isPreview }: { isPreview: boolean }) {
  const count = isPreview ? 14 : 32;
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: 4000 + Math.random() * 5000,
      driftX: (Math.random() - 0.5) * 40,
      driftY: (Math.random() - 0.5) * 40,
      color: Math.random() > 0.4 ? '#FFEAA7' : '#00CEC9',
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <NativeParticleNode key={p.id} p={p} />
      ))}
    </View>
  );
}

function NativeParticleNode({ p }: { p: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: p.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: p.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, p]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.driftX] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.driftY] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${p.left}%`,
        top: `${p.top}%`,
        width: p.size,
        height: p.size,
        borderRadius: p.size / 2,
        backgroundColor: p.color,
        opacity: 0.6,
        transform: [{ translateX }, { translateY }],
        shadowColor: p.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }}
    />
  );
}

// -------------------------------------------------------------
// 16. Native Liquid Metal
// -------------------------------------------------------------
function NativeLiquidMetalAnimation({ isPreview }: { isPreview: boolean }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const transX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });
  const transY = sweep.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: isPreview ? 140 : 320,
          height: isPreview ? 140 : 320,
          borderRadius: 160,
          backgroundColor: '#DFE6E9',
          opacity: 0.18,
          transform: [{ translateX: transX }, { translateY: transY }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          width: isPreview ? 120 : 280,
          height: isPreview ? 120 : 280,
          borderRadius: 140,
          backgroundColor: '#74B9FF',
          opacity: 0.15,
          transform: [{ translateX: Animated.multiply(transX, -1) }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 17. Native Hologram
// -------------------------------------------------------------
function NativeHologramAnimation({ isPreview }: { isPreview: boolean }) {
  const scan = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const rotLoop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scanLoop.start();
    rotLoop.start();
    return () => {
      scanLoop.stop();
      rotLoop.stop();
    };
  }, [scan, rot]);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* HUD Reticle Circle */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '30%',
          alignSelf: 'center',
          width: isPreview ? 110 : 240,
          height: isPreview ? 110 : 240,
          borderRadius: 120,
          borderWidth: 1.5,
          borderColor: '#00E5FF',
          borderStyle: 'dashed',
          opacity: 0.35,
          transform: [{ rotate: spin }],
        }}
      />

      {/* Hologram Scanline Bar */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2.5,
          backgroundColor: '#00E5FF',
          opacity: 0.5,
          transform: [{ translateY: scanY }],
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 18. Native Black Hole
// -------------------------------------------------------------
function NativeBlackHoleAnimation({ isPreview }: { isPreview: boolean }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {/* Accretion Disk Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: isPreview ? 130 : 290,
          height: isPreview ? 130 : 290,
          borderRadius: 145,
          borderWidth: isPreview ? 8 : 18,
          borderColor: 'rgba(230, 126, 34, 0.45)',
          transform: [{ rotate: spin }, { scaleY: 0.55 }],
          shadowColor: '#E67E22',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 15,
        }}
      />
      {/* Event Horizon Core */}
      <View
        style={{
          width: isPreview ? 65 : 140,
          height: isPreview ? 65 : 140,
          borderRadius: 70,
          backgroundColor: '#050208',
          borderWidth: 2,
          borderColor: '#FFA502',
          shadowColor: '#FFA502',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 19. Native Lava Lamp
// -------------------------------------------------------------
function NativeLavaLampAnimation({ isPreview }: { isPreview: boolean }) {
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(b1, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(b1, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(b2, { toValue: 1, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(b2, { toValue: 0, duration: 13000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [b1, b2]);

  const y1 = b1.interpolate({ inputRange: [0, 1], outputRange: [120, -120] });
  const y2 = b2.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{
          position: 'absolute',
          top: '30%',
          left: '15%',
          width: isPreview ? 110 : 240,
          height: isPreview ? 110 : 240,
          borderRadius: 120,
          backgroundColor: '#FF416C',
          opacity: 0.25,
          transform: [{ translateY: y1 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: '45%',
          right: '15%',
          width: isPreview ? 120 : 260,
          height: isPreview ? 120 : 260,
          borderRadius: 130,
          backgroundColor: '#8A2387',
          opacity: 0.25,
          transform: [{ translateY: y2 }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 20. Native Clouds
// -------------------------------------------------------------
function NativeCloudsAnimation({ isPreview }: { isPreview: boolean }) {
  const c1 = useRef(new Animated.Value(0)).current;
  const c2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(c1, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(5000),
        Animated.timing(c2, {
          toValue: 1,
          duration: 32000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [c1, c2]);

  const x1 = c1.interpolate({ inputRange: [0, 1], outputRange: [-250, SCREEN_WIDTH + 150] });
  const x2 = c2.interpolate({ inputRange: [0, 1], outputRange: [-220, SCREEN_WIDTH + 150] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Moon Glow */}
      <View
        style={{
          position: 'absolute',
          top: '12%',
          right: '15%',
          width: isPreview ? 50 : 100,
          height: isPreview ? 50 : 100,
          borderRadius: 50,
          backgroundColor: 'rgba(224, 242, 254, 0.25)',
        }}
      />

      {/* Cloud 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '22%' : '26%',
          width: isPreview ? 140 : 300,
          height: isPreview ? 45 : 90,
          borderRadius: 45,
          backgroundColor: 'rgba(129, 236, 236, 0.22)',
          transform: [{ translateX: x1 }],
        }}
      />
      {/* Cloud 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '48%' : '54%',
          width: isPreview ? 160 : 340,
          height: isPreview ? 50 : 100,
          borderRadius: 50,
          backgroundColor: 'rgba(129, 236, 236, 0.18)',
          transform: [{ translateX: x2 }],
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// 21. Native Halloween (Haunted Night)
// -------------------------------------------------------------
function NativeHalloweenAnimation({ isPreview }: { isPreview: boolean }) {
  // Moon Breathing Pulse
  const moonPulse = useRef(new Animated.Value(1)).current;
  // Fog Drifts
  const fog1 = useRef(new Animated.Value(0)).current;
  const fog2 = useRef(new Animated.Value(0)).current;
  // Bat 1 & Bat 2 flight across sky
  const bat1 = useRef(new Animated.Value(0)).current;
  const bat2 = useRef(new Animated.Value(0)).current;
  const batFlap = useRef(new Animated.Value(0)).current;

  // Embers rising
  const emberCount = isPreview ? 10 : 20;
  const embers = useMemo(() => {
    return Array.from({ length: emberCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: 3500 + Math.random() * 3000,
      delay: Math.random() * 3000,
      drift: (Math.random() - 0.5) * 35,
      color: Math.random() > 0.4 ? '#FF7700' : '#FFA500',
    }));
  }, [emberCount]);

  useEffect(() => {
    // 1. Moon pulsing
    const moonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonPulse, {
          toValue: 1.08,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moonPulse, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Fog Drifts
    const fogLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(fog1, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fog1, {
          toValue: 0,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const fogLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(fog2, {
          toValue: 1,
          duration: 22000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fog2, {
          toValue: 0,
          duration: 22000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Bat swooping
    const batLoop1 = Animated.loop(
      Animated.timing(bat1, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const batLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(4500),
        Animated.timing(bat2, {
          toValue: 1,
          duration: 11000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Bat wing flap
    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(batFlap, {
          toValue: 1,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(batFlap, {
          toValue: 0,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    moonLoop.start();
    fogLoop1.start();
    fogLoop2.start();
    batLoop1.start();
    batLoop2.start();
    flapLoop.start();

    return () => {
      moonLoop.stop();
      fogLoop1.stop();
      fogLoop2.stop();
      batLoop1.stop();
      batLoop2.stop();
      flapLoop.stop();
    };
  }, [moonPulse, fog1, fog2, bat1, bat2, batFlap]);

  const fog1X = fog1.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });
  const fog2X = fog2.interpolate({ inputRange: [0, 1], outputRange: [50, -50] });

  const bat1X = bat1.interpolate({ inputRange: [0, 1], outputRange: [-80, SCREEN_WIDTH + 80] });
  const bat1Y = bat1.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [20, 5, 25, 10] });

  const bat2X = bat2.interpolate({ inputRange: [0, 1], outputRange: [-80, SCREEN_WIDTH + 80] });
  const bat2Y = bat2.interpolate({ inputRange: [0, 0.4, 0.8, 1], outputRange: [60, 40, 70, 50] });

  const wingScaleY = batFlap.interpolate({ inputRange: [0, 1], outputRange: [1, -0.6] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Night Sky Horizon Purple Hue */}
      <View
        style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          width: '80%',
          height: isPreview ? 120 : 260,
          borderRadius: 130,
          backgroundColor: '#300E4A',
          opacity: 0.35,
        }}
      />

      {/* Glowing Orange Moon with Breathing Scale */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '12%' : '14%',
          right: isPreview ? '10%' : '12%',
          width: isPreview ? 52 : 88,
          height: isPreview ? 52 : 88,
          borderRadius: isPreview ? 26 : 44,
          backgroundColor: '#FFA500',
          shadowColor: '#FF6600',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: isPreview ? 14 : 26,
          transform: [{ scale: moonPulse }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Inner moon highlight */}
        <View
          style={{
            width: isPreview ? 42 : 72,
            height: isPreview ? 42 : 72,
            borderRadius: isPreview ? 21 : 36,
            backgroundColor: '#FFCC00',
            opacity: 0.85,
          }}
        />
        {/* Moon subtle craters */}
        <View
          style={{
            position: 'absolute',
            top: '22%',
            left: '22%',
            width: isPreview ? 8 : 14,
            height: isPreview ? 8 : 14,
            borderRadius: 7,
            backgroundColor: 'rgba(180, 50, 0, 0.25)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: isPreview ? 11 : 18,
            height: isPreview ? 11 : 18,
            borderRadius: 9,
            backgroundColor: 'rgba(180, 50, 0, 0.22)',
          }}
        />
      </Animated.View>

      {/* Distant Haunted Castle Silhouette */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: isPreview ? 65 : 140,
          opacity: 0.92,
        }}
      >
        {/* Hill Curve */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: -30,
            right: -30,
            height: isPreview ? 45 : 95,
            backgroundColor: '#07010e',
            borderTopLeftRadius: 180,
            borderTopRightRadius: 180,
          }}
        />
        {/* Castle Towers */}
        <View
          style={{
            position: 'absolute',
            bottom: isPreview ? 20 : 45,
            left: isPreview ? '12%' : '14%',
            width: isPreview ? 40 : 85,
            height: isPreview ? 35 : 70,
            backgroundColor: '#07010e',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        >
          {/* Spire */}
          <View
            style={{
              position: 'absolute',
              top: isPreview ? -12 : -24,
              left: isPreview ? 14 : 30,
              width: 0,
              height: 0,
              borderLeftWidth: isPreview ? 6 : 12,
              borderRightWidth: isPreview ? 6 : 12,
              borderBottomWidth: isPreview ? 12 : 24,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#07010e',
            }}
          />
          {/* Flickering castle window */}
          <View
            style={{
              position: 'absolute',
              top: '35%',
              left: '40%',
              width: 4,
              height: 7,
              backgroundColor: '#FFA500',
              borderRadius: 1.5,
              shadowColor: '#FFA500',
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          />
        </View>

        {/* Left Side Small Turret */}
        <View
          style={{
            position: 'absolute',
            bottom: isPreview ? 15 : 35,
            left: isPreview ? '6%' : '8%',
            width: isPreview ? 20 : 42,
            height: isPreview ? 22 : 48,
            backgroundColor: '#07010e',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: isPreview ? -8 : -16,
              left: isPreview ? 5 : 11,
              width: 0,
              height: 0,
              borderLeftWidth: isPreview ? 5 : 10,
              borderRightWidth: isPreview ? 5 : 10,
              borderBottomWidth: isPreview ? 8 : 16,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#07010e',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: '40%',
              left: '38%',
              width: 3,
              height: 5,
              backgroundColor: '#FFA500',
              borderRadius: 1,
            }}
          />
        </View>
      </View>

      {/* Floating Fog Layer 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: isPreview ? 20 : 45,
          left: '-20%',
          width: '140%',
          height: isPreview ? 50 : 100,
          borderRadius: 50,
          backgroundColor: '#8422A7',
          opacity: 0.16,
          transform: [{ translateX: fog1X }],
        }}
      />

      {/* Floating Fog Layer 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: isPreview ? 5 : 15,
          left: '-15%',
          width: '130%',
          height: isPreview ? 45 : 90,
          borderRadius: 45,
          backgroundColor: '#52146C',
          opacity: 0.20,
          transform: [{ translateX: fog2X }],
        }}
      />

      {/* Swooping Bat 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '18%' : '20%',
          transform: [{ translateX: bat1X }, { translateY: bat1Y }],
        }}
      >
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scaleY: wingScaleY }] }}>
          {/* Left Wing */}
          <View
            style={{
              width: isPreview ? 8 : 14,
              height: isPreview ? 5 : 9,
              backgroundColor: '#0B0212',
              borderTopLeftRadius: 10,
              borderBottomRightRadius: 6,
            }}
          />
          {/* Bat Body */}
          <View
            style={{
              width: isPreview ? 4 : 6,
              height: isPreview ? 6 : 10,
              backgroundColor: '#0B0212',
              borderRadius: 3,
            }}
          />
          {/* Right Wing */}
          <View
            style={{
              width: isPreview ? 8 : 14,
              height: isPreview ? 5 : 9,
              backgroundColor: '#0B0212',
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 6,
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Swooping Bat 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '30%' : '34%',
          transform: [{ translateX: bat2X }, { translateY: bat2Y }],
        }}
      >
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scaleY: wingScaleY }, { scale: 0.8 }] }}>
          <View
            style={{
              width: isPreview ? 8 : 14,
              height: isPreview ? 5 : 9,
              backgroundColor: '#0B0212',
              borderTopLeftRadius: 10,
              borderBottomRightRadius: 6,
            }}
          />
          <View
            style={{
              width: isPreview ? 4 : 6,
              height: isPreview ? 6 : 10,
              backgroundColor: '#0B0212',
              borderRadius: 3,
            }}
          />
          <View
            style={{
              width: isPreview ? 8 : 14,
              height: isPreview ? 5 : 9,
              backgroundColor: '#0B0212',
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 6,
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Rising Orange Embers */}
      {embers.map((ember) => (
        <NativeHalloweenEmber key={ember.id} ember={ember} />
      ))}
    </View>
  );
}

function NativeHalloweenEmber({ ember }: { ember: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(ember.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: ember.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, ember]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.7, -40],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, ember.drift, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.9, 0.9, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${ember.left}%`,
        bottom: 0,
        width: ember.size,
        height: ember.size,
        borderRadius: ember.size / 2,
        backgroundColor: ember.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: '#FF7700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
      }}
    />
  );
}

// -------------------------------------------------------------
// 22. Native Pumpkin Hollow (Jack-o'-lanterns, spirits, wisps)
// -------------------------------------------------------------
function NativePumpkinHollowAnimation({ isPreview }: { isPreview: boolean }) {
  // Harvest Moon Pulse
  const moonPulse = useRef(new Animated.Value(1)).current;
  // Pumpkin Candlelight Flicker (1 & 2)
  const pumpkinFlicker1 = useRef(new Animated.Value(1)).current;
  const pumpkinFlicker2 = useRef(new Animated.Value(1)).current;
  // Floating Spirit / Ghost 1 & Ghost 2
  const ghost1 = useRef(new Animated.Value(0)).current;
  const ghost1Bob = useRef(new Animated.Value(0)).current;
  const ghost2 = useRef(new Animated.Value(0)).current;
  const ghost2Bob = useRef(new Animated.Value(0)).current;

  // Swirling Witching Fireflies & Emerald Wisps
  const wispCount = isPreview ? 10 : 20;
  const wisps = useMemo(() => {
    return Array.from({ length: wispCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 3.5 + 1.5,
      duration: 3800 + Math.random() * 3200,
      delay: Math.random() * 3000,
      drift: (Math.random() - 0.5) * 45,
      color: Math.random() > 0.45 ? '#00E676' : (Math.random() > 0.5 ? '#FF6D00' : '#A855F7'),
      glowColor: Math.random() > 0.45 ? '#00E676' : '#FF6D00',
    }));
  }, [wispCount]);

  useEffect(() => {
    // 1. Moon breathing pulse
    const moonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonPulse, {
          toValue: 1.07,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moonPulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Jack-o'-lantern candlelight flickers
    const flickLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pumpkinFlicker1, {
          toValue: 0.72,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker1, {
          toValue: 1.0,
          duration: 180,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker1, {
          toValue: 0.85,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker1, {
          toValue: 1.0,
          duration: 240,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    const flickLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(pumpkinFlicker2, {
          toValue: 0.82,
          duration: 160,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker2, {
          toValue: 1.0,
          duration: 110,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker2, {
          toValue: 0.70,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pumpkinFlicker2, {
          toValue: 0.95,
          duration: 210,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Ghost 1 drift & bob
    const gLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ghost1, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ghost1, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const gBobLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ghost1Bob, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ghost1Bob, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Ghost 2 drift & bob
    const gLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(ghost2, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ghost2, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const gBobLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(ghost2Bob, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ghost2Bob, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    moonLoop.start();
    flickLoop1.start();
    flickLoop2.start();
    gLoop1.start();
    gBobLoop1.start();
    gLoop2.start();
    gBobLoop2.start();

    return () => {
      moonLoop.stop();
      flickLoop1.stop();
      flickLoop2.stop();
      gLoop1.stop();
      gBobLoop1.stop();
      gLoop2.stop();
      gBobLoop2.stop();
    };
  }, [moonPulse, pumpkinFlicker1, pumpkinFlicker2, ghost1, ghost1Bob, ghost2, ghost2Bob]);

  const ghost1X = ghost1.interpolate({ inputRange: [0, 1], outputRange: [-20, SCREEN_WIDTH * 0.75] });
  const ghost1Y = ghost1Bob.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  const ghost2X = ghost2.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_WIDTH * 0.85, -10] });
  const ghost2Y = ghost2Bob.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Mystical Greenish-Purple Twilight Ambient Aura */}
      <View
        style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          width: '90%',
          height: isPreview ? 140 : 280,
          borderRadius: 140,
          backgroundColor: '#0F2E1E',
          opacity: 0.35,
        }}
      />

      {/* Harvest Moon with Emerald Corona */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '10%' : '12%',
          left: isPreview ? '8%' : '10%',
          width: isPreview ? 48 : 80,
          height: isPreview ? 48 : 80,
          borderRadius: isPreview ? 24 : 40,
          backgroundColor: '#A7F3D0',
          shadowColor: '#00E676',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: isPreview ? 14 : 26,
          transform: [{ scale: moonPulse }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: isPreview ? 38 : 64,
            height: isPreview ? 38 : 64,
            borderRadius: isPreview ? 19 : 32,
            backgroundColor: '#FFD166',
            opacity: 0.9,
          }}
        />
      </Animated.View>

      {/* Spooky Branch Silhouettes */}
      <View
        style={{
          position: 'absolute',
          top: isPreview ? '22%' : '24%',
          right: 0,
          width: isPreview ? 50 : 90,
          height: isPreview ? 24 : 42,
          backgroundColor: '#030805',
          borderTopLeftRadius: 30,
          borderBottomLeftRadius: 15,
          opacity: 0.85,
        }}
      />

      {/* Spectral Spirit Ghost 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '28%' : '32%',
          transform: [{ translateX: ghost1X }, { translateY: ghost1Y }],
          opacity: 0.78,
        }}
      >
        <View
          style={{
            width: isPreview ? 24 : 38,
            height: isPreview ? 32 : 50,
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            backgroundColor: 'rgba(235, 255, 245, 0.85)',
            shadowColor: '#00E676',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 10,
            alignItems: 'center',
            paddingTop: isPreview ? 6 : 10,
          }}
        >
          {/* Eyes */}
          <View style={{ flexDirection: 'row', gap: isPreview ? 4 : 7 }}>
            <View style={{ width: isPreview ? 3 : 5, height: isPreview ? 5 : 7, borderRadius: 3, backgroundColor: '#051A0E' }} />
            <View style={{ width: isPreview ? 3 : 5, height: isPreview ? 5 : 7, borderRadius: 3, backgroundColor: '#051A0E' }} />
          </View>
          {/* Mouth */}
          <View style={{ width: isPreview ? 3 : 5, height: isPreview ? 4 : 6, borderRadius: 3, backgroundColor: '#051A0E', marginTop: 3 }} />
        </View>
      </Animated.View>

      {/* Spectral Spirit Ghost 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: isPreview ? '46%' : '48%',
          transform: [{ translateX: ghost2X }, { translateY: ghost2Y }],
          opacity: 0.65,
        }}
      >
        <View
          style={{
            width: isPreview ? 20 : 32,
            height: isPreview ? 26 : 42,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: 'rgba(200, 255, 230, 0.80)',
            shadowColor: '#00E676',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            alignItems: 'center',
            paddingTop: isPreview ? 5 : 8,
          }}
        >
          <View style={{ flexDirection: 'row', gap: isPreview ? 3 : 5 }}>
            <View style={{ width: isPreview ? 2.5 : 4, height: isPreview ? 4 : 6, borderRadius: 2, backgroundColor: '#051A0E' }} />
            <View style={{ width: isPreview ? 2.5 : 4, height: isPreview ? 4 : 6, borderRadius: 2, backgroundColor: '#051A0E' }} />
          </View>
        </View>
      </Animated.View>

      {/* Ground Silhouette */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: isPreview ? 45 : 85,
          backgroundColor: '#040906',
          borderTopLeftRadius: 50,
          borderTopRightRadius: 40,
        }}
      />

      {/* Jack-o'-Lantern 1 (Bottom Left) */}
      <View
        style={{
          position: 'absolute',
          bottom: isPreview ? 10 : 20,
          left: isPreview ? '12%' : '14%',
          width: isPreview ? 36 : 60,
          height: isPreview ? 28 : 46,
          borderRadius: 24,
          backgroundColor: '#2A0C02',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Stem */}
        <View
          style={{
            position: 'absolute',
            top: -6,
            width: 5,
            height: 7,
            backgroundColor: '#112211',
            borderRadius: 2,
          }}
        />
        {/* Carved Glowing Features */}
        <Animated.View
          style={{
            opacity: pumpkinFlicker1,
            alignItems: 'center',
            shadowColor: '#FF6D00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
          }}
        >
          {/* Eyes */}
          <View style={{ flexDirection: 'row', gap: isPreview ? 7 : 12, marginBottom: 2 }}>
            <View style={{ width: isPreview ? 4 : 7, height: isPreview ? 4 : 7, backgroundColor: '#FFA000', transform: [{ rotate: '45deg' }] }} />
            <View style={{ width: isPreview ? 4 : 7, height: isPreview ? 4 : 7, backgroundColor: '#FFA000', transform: [{ rotate: '45deg' }] }} />
          </View>
          {/* Sinister Mouth */}
          <View
            style={{
              width: isPreview ? 14 : 24,
              height: isPreview ? 4 : 6,
              backgroundColor: '#FF6D00',
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
            }}
          />
        </Animated.View>
      </View>

      {/* Jack-o'-Lantern 2 (Bottom Right) */}
      <View
        style={{
          position: 'absolute',
          bottom: isPreview ? 14 : 26,
          right: isPreview ? '14%' : '16%',
          width: isPreview ? 42 : 68,
          height: isPreview ? 32 : 52,
          borderRadius: 28,
          backgroundColor: '#260B02',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Stem */}
        <View
          style={{
            position: 'absolute',
            top: -7,
            width: 6,
            height: 8,
            backgroundColor: '#112211',
            borderRadius: 2,
          }}
        />
        {/* Carved Glowing Features */}
        <Animated.View
          style={{
            opacity: pumpkinFlicker2,
            alignItems: 'center',
            shadowColor: '#FF6D00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 10,
          }}
        >
          <View style={{ flexDirection: 'row', gap: isPreview ? 8 : 14, marginBottom: 3 }}>
            <View style={{ width: isPreview ? 5 : 8, height: isPreview ? 5 : 8, backgroundColor: '#FFB300', transform: [{ rotate: '45deg' }] }} />
            <View style={{ width: isPreview ? 5 : 8, height: isPreview ? 5 : 8, backgroundColor: '#FFB300', transform: [{ rotate: '45deg' }] }} />
          </View>
          <View
            style={{
              width: isPreview ? 18 : 28,
              height: isPreview ? 5 : 8,
              backgroundColor: '#FF7700',
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          />
        </Animated.View>
      </View>

      {/* Swirling Witching Fireflies & Emerald Wisps */}
      {wisps.map((wisp) => (
        <NativePumpkinHollowWisp key={wisp.id} wisp={wisp} />
      ))}
    </View>
  );
}

function NativePumpkinHollowWisp({ wisp }: { wisp: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(wisp.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: wisp.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, wisp]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.75, -30],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, wisp.drift, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0, 0.95, 0.95, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${wisp.left}%`,
        bottom: 0,
        width: wisp.size,
        height: wisp.size,
        borderRadius: wisp.size / 2,
        backgroundColor: wisp.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: wisp.glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 5,
      }}
    />
  );
}

// -------------------------------------------------------------
// 23. Native Cursed Crypt (graveyard, moon, ravens, mist, wisps, lightning)
// -------------------------------------------------------------
function NativeCursedCryptAnimation({ isPreview }: { isPreview: boolean }) {
  const moonPulse = useRef(new Animated.Value(1)).current;
  const flame1 = useRef(new Animated.Value(1)).current;
  const flame2 = useRef(new Animated.Value(1)).current;
  const raven1 = useRef(new Animated.Value(0)).current;
  const raven2 = useRef(new Animated.Value(0)).current;
  const mist1 = useRef(new Animated.Value(0)).current;
  const mist2 = useRef(new Animated.Value(0)).current;
  const lightning = useRef(new Animated.Value(0)).current;

  const fireflyCount = isPreview ? 6 : 12;
  const fireflies = useMemo(() => {
    return Array.from({ length: fireflyCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 2.6 + 1,
      duration: 4200 + Math.random() * 3000,
      delay: Math.random() * 3500,
      drift: (Math.random() - 0.5) * 40,
      color: Math.random() > 0.5 ? '#39FF88' : '#B026FF',
    }));
  }, [fireflyCount]);

  useEffect(() => {
    const moonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonPulse, { toValue: 1.08, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(moonPulse, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const flameLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(flame1, { toValue: 0.65, duration: 130, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 1.0, duration: 170, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 0.8, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 1.0, duration: 220, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    const flameLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(flame2, { toValue: 0.78, duration: 150, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 1.0, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 0.68, duration: 160, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 0.95, duration: 200, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    const ravenLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(raven1, { toValue: 1, duration: 13000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(raven1, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(2500),
      ])
    );

    const ravenLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(5000),
        Animated.timing(raven2, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(raven2, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3500),
      ])
    );

    const mistLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(mist1, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(mist1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    const mistLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(mist2, { toValue: 0, duration: 26000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(mist2, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );

    const lightningLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(4000 + Math.random() * 5000),
        Animated.timing(lightning, { toValue: 0.3, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0, duration: 90, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0.18, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    moonLoop.start();
    flameLoop1.start();
    flameLoop2.start();
    ravenLoop1.start();
    ravenLoop2.start();
    mistLoop1.start();
    mistLoop2.start();
    lightningLoop.start();

    return () => {
      moonLoop.stop();
      flameLoop1.stop();
      flameLoop2.stop();
      ravenLoop1.stop();
      ravenLoop2.stop();
      mistLoop1.stop();
      mistLoop2.stop();
      lightningLoop.stop();
    };
  }, [moonPulse, flame1, flame2, raven1, raven2, mist1, mist2, lightning]);

  const ravenX1 = raven1.interpolate({ inputRange: [0, 1], outputRange: [-60, SCREEN_WIDTH + 60] });
  const ravenX2 = raven2.interpolate({ inputRange: [0, 1], outputRange: [-60, SCREEN_WIDTH + 60] });
  const mistX1 = mist1.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_WIDTH * 0.5, SCREEN_WIDTH * 1.3] });
  const mistX2 = mist2.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_WIDTH * 1.3, -SCREEN_WIDTH * 0.5] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep void gradient background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0410' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1C0710', opacity: 0.35, top: '55%' }]} />

      {/* Blood-Red Moon with pulsing halo */}
      <Animated.View
        style={{
          position: 'absolute',
          right: SCREEN_WIDTH * 0.1,
          top: isPreview ? SCREEN_HEIGHT * 0.1 : SCREEN_HEIGHT * 0.08,
          width: isPreview ? 44 : 76,
          height: isPreview ? 44 : 76,
          borderRadius: 40,
          backgroundColor: '#E53935',
          transform: [{ scale: moonPulse }],
          shadowColor: '#E53935',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 20,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          right: SCREEN_WIDTH * 0.1 - 20,
          top: (isPreview ? SCREEN_HEIGHT * 0.1 : SCREEN_HEIGHT * 0.08) - 20,
          width: isPreview ? 84 : 116,
          height: isPreview ? 84 : 116,
          borderRadius: 60,
          backgroundColor: 'rgba(176, 38, 255, 0.18)',
          transform: [{ scale: moonPulse }],
        }}
      />

      {/* Graveyard hill silhouette */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.22,
          backgroundColor: '#060308',
          borderTopLeftRadius: SCREEN_WIDTH * 0.6,
          borderTopRightRadius: SCREEN_WIDTH * 0.4,
        }}
      />

      {/* Tombstones with flickering candle flames */}
      {[{ left: '14%', h: isPreview ? 22 : 36, flame: flame1 }, { left: '38%', h: isPreview ? 28 : 44, flame: flame2 }, { left: '64%', h: isPreview ? 20 : 32, flame: flame1 }, { left: '85%', h: isPreview ? 26 : 40, flame: flame2 }].map((stone, idx) => (
        <View key={idx} style={{ position: 'absolute', left: stone.left as any, bottom: SCREEN_HEIGHT * 0.06 }}>
          <View
            style={{
              width: isPreview ? 14 : 22,
              height: stone.h,
              backgroundColor: '#141018',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(229, 57, 53, 0.2)',
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: -10,
              left: (isPreview ? 14 : 22) / 2 - 4,
              width: 8,
              height: 10,
              borderRadius: 4,
              backgroundColor: '#D6B3FF',
              opacity: stone.flame,
              transform: [{ scale: stone.flame }],
              shadowColor: '#B026FF',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          />
        </View>
      ))}

      {/* Crawling cursed green mist */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: SCREEN_HEIGHT * 0.1,
          width: SCREEN_WIDTH * 0.7,
          height: isPreview ? 30 : 55,
          borderRadius: 100,
          backgroundColor: 'rgba(57, 255, 136, 0.10)',
          transform: [{ translateX: mistX1 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: SCREEN_HEIGHT * 0.15,
          width: SCREEN_WIDTH * 0.6,
          height: isPreview ? 24 : 42,
          borderRadius: 100,
          backgroundColor: 'rgba(57, 255, 136, 0.08)',
          transform: [{ translateX: mistX2 }],
        }}
      />

      {/* Circling ravens */}
      <Animated.View style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.15, transform: [{ translateX: ravenX1 }] }}>
        <View style={{ width: isPreview ? 10 : 16, height: 2, backgroundColor: '#0A0A0D', borderRadius: 2 }} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.25, transform: [{ translateX: ravenX2 }] }}>
        <View style={{ width: isPreview ? 8 : 13, height: 2, backgroundColor: '#0A0A0D', borderRadius: 2 }} />
      </Animated.View>

      {/* Rising cursed will-o'-wisp fireflies */}
      {fireflies.map((f) => (
        <NativeCursedCryptFirefly key={f.id} firefly={f} />
      ))}

      {/* Rare lightning flash */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#B026FF', opacity: lightning },
        ]}
      />
    </View>
  );
}

function NativeCursedCryptFirefly({ firefly }: { firefly: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(firefly.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: firefly.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, firefly]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.78, SCREEN_HEIGHT * 0.3],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, firefly.drift, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.9, 0.9, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${firefly.left}%`,
        bottom: 0,
        width: firefly.size,
        height: firefly.size,
        borderRadius: firefly.size / 2,
        backgroundColor: firefly.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: firefly.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 5,
      }}
    />
  );
}

// =========================================================================
// HALLOWEEN EXCLUSIVE AVATAR FRAME & SPECIAL EFFECTS
// =========================================================================

interface HalloweenAvatarFrameProps {
  children: React.ReactNode;
  size?: number;
  active?: boolean;
  themeId?: string | null;
}

export function HalloweenAvatarFrame({ children, size = 100, active = true, themeId = 'halloween' }: HalloweenAvatarFrameProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const batOrbitAnim = useRef(new Animated.Value(0)).current;
  const batFlapAnim = useRef(new Animated.Value(0)).current;

  const isPumpkinTheme = themeId === 'pumpkin_hollow';
  const isCryptTheme = themeId === 'cursed_crypt';

  useEffect(() => {
    if (!active) return;

    // Slow magical rune ring rotation
    const rotLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: isPumpkinTheme ? 16000 : isCryptTheme ? 18000 : 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Subtle magical pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: isPumpkinTheme ? 2000 : isCryptTheme ? 2200 : 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: isPumpkinTheme ? 2000 : isCryptTheme ? 2200 : 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Bat / Spirit / Raven circling or flying over the magical ring
    const batLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(batOrbitAnim, {
          toValue: 1,
          duration: isPumpkinTheme ? 7000 : isCryptTheme ? 7500 : 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Wing / spirit flap
    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(batFlapAnim, {
          toValue: 1,
          duration: 110,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(batFlapAnim, {
          toValue: 0,
          duration: 110,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    rotLoop.start();
    pulseLoop.start();
    batLoop.start();
    flapLoop.start();

    return () => {
      rotLoop.stop();
      pulseLoop.stop();
      batLoop.stop();
      flapLoop.stop();
    };
  }, [active, rotateAnim, pulseAnim, batOrbitAnim, batFlapAnim, isPumpkinTheme, isCryptTheme]);

  if (!active) {
    return <>{children}</>;
  }

  const ringSize = size + 16;
  const outerSize = size + 28;

  const ringRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isPumpkinTheme ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.95],
  });

  const batAngle = batOrbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const batWingScale = batFlapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -0.6],
  });

  const primaryRingColor = isPumpkinTheme ? '#00E676' : isCryptTheme ? '#E53935' : '#FF7700';
  const secondaryAuraColor = isPumpkinTheme ? '#103B22' : isCryptTheme ? '#3A0A2E' : '#8422A7';
  const shadowGlow = isPumpkinTheme ? '#00E676' : isCryptTheme ? '#B026FF' : '#FF7700';

  return (
    <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Ambient Aura */}
      <Animated.View
        style={{
          position: 'absolute',
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: 2,
          borderColor: secondaryAuraColor,
          backgroundColor: isPumpkinTheme ? 'rgba(0, 230, 118, 0.12)' : isCryptTheme ? 'rgba(229, 57, 53, 0.12)' : 'rgba(132, 34, 167, 0.12)',
          opacity: glowOpacity,
          shadowColor: shadowGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 12,
        }}
      />

      {/* Cracked / Runed Magical Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2.5,
          borderColor: primaryRingColor,
          borderStyle: 'dashed',
          transform: [{ rotate: ringRotate }],
          shadowColor: shadowGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
        }}
      >
        {/* Magic Crystal Top */}
        <View
          style={{
            position: 'absolute',
            top: -4,
            left: ringSize / 2 - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isPumpkinTheme ? '#A7F3D0' : isCryptTheme ? '#D6B3FF' : '#FFD700',
            shadowColor: shadowGlow,
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />
        {/* Magic Crystal Bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: -4,
            left: ringSize / 2 - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isPumpkinTheme ? '#FF6D00' : isCryptTheme ? '#B026FF' : '#C084FC',
            shadowColor: isPumpkinTheme ? '#FF6D00' : isCryptTheme ? '#B026FF' : '#8422A7',
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />
        {/* Magic Crack Left */}
        <View
          style={{
            position: 'absolute',
            top: ringSize / 2 - 4,
            left: -4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: primaryRingColor,
          }}
        />
        {/* Magic Crack Right */}
        <View
          style={{
            position: 'absolute',
            top: ringSize / 2 - 4,
            right: -4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: primaryRingColor,
          }}
        />
      </Animated.View>

      {/* Circling Mini Bat / Spirit over the magical ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSize + 14,
          height: ringSize + 14,
          justifyContent: 'flex-start',
          alignItems: 'center',
          transform: [{ rotate: batAngle }],
          pointerEvents: 'none',
        }}
      >
        {isPumpkinTheme ? (
          /* Mini Floating Spirit */
          <View
            style={{
              width: 10,
              height: 12,
              borderRadius: 5,
              backgroundColor: '#A7F3D0',
              shadowColor: '#00E676',
              shadowOpacity: 1,
              shadowRadius: 5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#02180B' }} />
          </View>
        ) : isCryptTheme ? (
          /* Mini Circling Raven */
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scaleY: batWingScale }, { rotate: '90deg' }],
            }}
          >
            <View style={{ width: 6, height: 3.5, backgroundColor: '#0A0A0D', borderTopLeftRadius: 4, borderBottomRightRadius: 2 }} />
            <View style={{ width: 3, height: 4.5, backgroundColor: '#2E0812', borderRadius: 2, shadowColor: '#E53935', shadowOpacity: 1, shadowRadius: 3 }} />
            <View style={{ width: 6, height: 3.5, backgroundColor: '#0A0A0D', borderTopRightRadius: 4, borderBottomLeftRadius: 2 }} />
          </Animated.View>
        ) : (
          /* Mini Flying Bat */
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scaleY: batWingScale }, { rotate: '90deg' }],
            }}
          >
            {/* Bat Left Wing */}
            <View
              style={{
                width: 6,
                height: 4,
                backgroundColor: '#000000',
                borderTopLeftRadius: 4,
                borderBottomRightRadius: 2,
              }}
            />
            {/* Bat Body */}
            <View
              style={{
                width: 3,
                height: 5,
                backgroundColor: '#2E0854',
                borderRadius: 2,
                shadowColor: '#FF7700',
                shadowOpacity: 1,
                shadowRadius: 3,
              }}
            />
            {/* Bat Right Wing */}
            <View
              style={{
                width: 6,
                height: 4,
                backgroundColor: '#000000',
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
              }}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Avatar Content */}
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
