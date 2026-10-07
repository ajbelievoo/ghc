"use client";

import { useEffect, useRef } from "react";

interface Props {
  color?: string;
}

export default function Drone404Background({ color = "#00B7FF" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!canvasCtx) return;

    const cnv = canvas;
    let width = 0, height = 0;
    let drones: Drone[] = [];
    let mouse = { x: null as number | null, y: null as number | null };
    let rafId = 0;

    const DRONE_COUNT = 55;
    const CONNECT_DIST = 160;
    const MOUSE_DIST = 220;

    function resize() {
      width = cnv.width = window.innerWidth;
      height = cnv.height = window.innerHeight;
    }

    class Drone {
      x = 0; y = 0; vx = 0; vy = 0; size = 0; angle = 0; spin = 0;
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.size = 5 + Math.random() * 5;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.04;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.spin;
        if (this.x < -30) this.x = width + 30;
        if (this.x > width + 30) this.x = -30;
        if (this.y < -30) this.y = height + 30;
        if (this.y > height + 30) this.y = -30;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST && d > 0) {
            this.x += (dx / d) * 2.2;
            this.y += (dy / d) * 2.2;
          }
        }
      }
      draw() {
        drawDrone(canvasCtx, this.x, this.y, this.size, this.angle, color);
      }
    }

    function drawDrone(c: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, stroke: string) {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.strokeStyle = stroke;
      c.globalAlpha = 0.55;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-size, 0); c.lineTo(size, 0);
      c.moveTo(0, -size); c.lineTo(0, size);
      c.stroke();

      c.fillStyle = stroke;
      const rotors = [[-size, 0], [size, 0], [0, -size], [0, size]];
      rotors.forEach(([dx, dy]) => {
        c.beginPath();
        c.arc(dx, dy, size / 3.5, 0, Math.PI * 2);
        c.fill();
      });

      c.beginPath();
      c.arc(0, 0, size / 5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawConnections() {
      for (let i = 0; i < drones.length; i++) {
        for (let j = i + 1; j < drones.length; j++) {
          const dx = drones[i].x - drones[j].x;
          const dy = drones[i].y - drones[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = color;
            canvasCtx.globalAlpha = 0.12 * (1 - d / CONNECT_DIST);
            canvasCtx.lineWidth = 0.8;
            canvasCtx.moveTo(drones[i].x, drones[i].y);
            canvasCtx.lineTo(drones[j].x, drones[j].y);
            canvasCtx.stroke();
          }
        }
      }
    }

    function loop() {
      canvasCtx.clearRect(0, 0, width, height);
      drawConnections();
      drones.forEach((d) => { d.update(); d.draw(); });
      rafId = requestAnimationFrame(loop);
    }

    function onResize() { resize(); }
    function onMove(e: MouseEvent) {
      const rect = cnv.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = null; mouse.y = null; }

    resize();
    for (let i = 0; i < DRONE_COUNT; i++) drones.push(new Drone());
    loop();

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}
