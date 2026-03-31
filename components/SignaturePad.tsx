'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
};

type Props = {
  height?: number;
  onEnd?: () => void;  // ← ADD THIS
};

const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ height = 160, onEnd }, ref) => {  // ← ADD onEnd HERE
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

    const getOffsetPos = useCallback((e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        const t = e.touches[0] || e.changedTouches[0];
        clientX = t.clientX;
        clientY = t.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);

    const beginStroke = useCallback((x: number, y: number) => {
      drawing.current = true;
      lastPoint.current = { x, y };
      hasInk.current = true;
    }, []);

    const drawTo = useCallback(
      (x: number, y: number) => {
        if (!drawing.current) return;
        const ctx = getCtx();
        if (!ctx || !lastPoint.current) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPoint.current = { x, y };
      },
      [getCtx]
    );

    const endStroke = useCallback(() => {
      drawing.current = false;
      lastPoint.current = null;
      
      // ← CALL onEnd WHEN STROKE FINISHES
      if (hasInk.current && onEnd) {
        onEnd();
      }
    }, [onEnd]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = getCtx();
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk.current = false;
    }, [getCtx]);

    const isEmpty = useCallback(() => !hasInk.current, []);
    const toDataURL = useCallback(() => (canvasRef.current ? canvasRef.current.toDataURL('image/png') : ''), []);

    useImperativeHandle(ref, () => ({ clear, isEmpty, toDataURL }), [clear, isEmpty, toDataURL]);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const { width, height: cssH } = canvas.getBoundingClientRect();
      const w = Math.max(Math.floor(width * ratio), 1);
      const h = Math.max(Math.floor(cssH * ratio), 1);
      if (canvas.width === w && canvas.height === h) return;
      const prev = getCtx()?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = w;
      canvas.height = h;
      const ctx = getCtx();
      if (ctx) {
        ctx.scale(ratio, ratio);
        if (prev) ctx.putImageData(prev, 0, 0);
      }
    }, [getCtx]);

    useEffect(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    useEffect(() => {
      const canvas = canvasRef.current!;
      const onMouseDown = (e: MouseEvent) => {
        const { x, y } = getOffsetPos(e);
        beginStroke(x, y);
      };
      const onMouseMove = (e: MouseEvent) => {
        const { x, y } = getOffsetPos(e);
        drawTo(x, y);
      };
      const onMouseUp = () => endStroke();

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const { x, y } = getOffsetPos(e);
        beginStroke(x, y);
      };
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const { x, y } = getOffsetPos(e);
        drawTo(x, y);
      };
      const onTouchEnd = () => endStroke();

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    }, [beginStroke, drawTo, endStroke, getOffsetPos]);

    return (
      <div className="rounded-xl border border-gray-300 bg-white">
        <div style={{ height }}>
          <canvas ref={canvasRef} className="h-full w-full touch-none rounded-xl" />
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;