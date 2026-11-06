"use client";

import { useEffect, useRef, useState } from "react";
import { vertexShader, fragmentShader } from "./fall-spiral-shader";

/** A bounded GPU surface: CSS handles card resizing without reallocating buffers. */
export function FallSpiral({
  className = "",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setReady(false);
    const canvas = canvasRef.current;
    if (!canvas || !animated || !motionAllowed) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const release = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    program = gl.createProgram();
    buffer = gl.createBuffer();
    if (!vertex || !fragment || !program || !buffer) {
      release();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const time = gl.getUniformLocation(program, "uTime");
    gl.uniform2f(
      gl.getUniformLocation(program, "uResolution"),
      canvas.width,
      canvas.height
    );

    let frame = 0;
    let elapsed = 0;
    let lastDraw = 0;
    let previous = 0;
    let inView = true;
    let lost = false;
    const draw = () => {
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      frame = 0;
      if (lost || !inView || document.hidden) return;
      if (previous) elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (now - lastDraw >= 1000 / 30) {
        draw();
        lastDraw = now;
      }
      frame = window.requestAnimationFrame(tick);
    };
    const sync = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (!lost && inView && !document.hidden)
        frame = window.requestAnimationFrame(tick);
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      setReady(false);
      sync();
    };
    const onRestored = () => setRevision((value) => value + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    document.addEventListener("visibilitychange", sync);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            sync();
          });
    observer?.observe(canvas);
    draw();
    setReady(true);
    sync();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", sync);
      release();
    };
  }, [animated, motionAllowed, revision]);

  return (
    <span className={className} style={{ display: "block" }} aria-hidden="true">
      <span
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {/* The print remains visible before shader startup, without WebGL, or with reduced motion. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/time-to-fall-spiral.webp"
          width={1200}
          height={1200}
          alt=""
          decoding="async"
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            clipPath: "circle(50%)",
          }}
        />
        {animated && (
          <canvas
            ref={canvasRef}
            width={640}
            height={640}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: ready && motionAllowed ? 1 : 0,
              pointerEvents: "none",
              clipPath: "circle(50%)",
            }}
          />
        )}
      </span>
    </span>
  );
}
