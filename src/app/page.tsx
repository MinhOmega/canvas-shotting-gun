"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

const FPSCounter = ({ fps }: { fps: number }) => {
  return (
    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
      FPS: {fps.toFixed(2)}
    </div>
  );
};

const MemoizedFPSCounter = React.memo(FPSCounter);

const CanvasGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [bulletSlot, setBulletSlot] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bulletPlaced, setBulletPlaced] = useState(false);
  const [bulletVisible, setBulletVisible] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [safeSlots, setSafeSlots] = useState<number[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [fps, setFps] = useState(0);

  const fpsRef = useRef(0);
  const lastUpdateTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  const updateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastUpdateTimeRef.current;
    frameCountRef.current++;

    if (delta >= 1000) {
      fpsRef.current = (frameCountRef.current * 1000) / delta;
      setFps(fpsRef.current);
      frameCountRef.current = 0;
      lastUpdateTimeRef.current = now;
    }

    requestAnimationFrame(updateFPS);
  }, []);

  useEffect(() => {
    const animationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationId);
  }, [updateFPS]);

  const drawGun = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(currentRotation);

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * 50;
      const y = Math.sin(angle) * 50;

      context.beginPath();
      context.arc(x, y, 20, 0, 2 * Math.PI, false);

      if (safeSlots.includes(i)) {
        context.strokeStyle = "green";
        context.fillStyle = "#a8e6cf";
      } else {
        context.strokeStyle = "black";
        context.fillStyle = "rgba(0, 0, 0, 0.1)";
      }
      context.fill();
      context.lineWidth = 2;
      context.stroke();

      if (isGameOver && i === bulletSlot) {
        context.fillStyle = "red";
        context.fill();
        context.strokeStyle = "black";
        context.stroke();
      }

      context.save();
      context.translate(x, y);
      context.rotate(-currentRotation);
      context.fillStyle = "#000";
      context.font = "16px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText((i + 1).toString(), 0, 0);
      context.restore();
    }

    context.restore();
  }, [currentRotation, bulletSlot, safeSlots, isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight);
      canvas.width = size;
      canvas.height = size;
      drawGun();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [drawGun]);

  useEffect(() => {
    drawGun();
  }, [drawGun, bulletVisible, isSpinning]);

  const injectBullet = useCallback(() => {
    if (!bulletPlaced) {
      setBulletSlot(0);
      setBulletPlaced(true);
      setBulletVisible(true);
      setTimeout(() => {
        setIsSpinning(true);
        let spinTime = 0;
        const spinDuration = 2500;
        const maxSpinSpeed = 0.3;

        const spinInterval = setInterval(() => {
          const progress = spinTime / spinDuration;
          const spinSpeed = maxSpinSpeed * Math.sin(progress * Math.PI);
          setCurrentRotation((prevRotation) => prevRotation + spinSpeed);
          spinTime += 16;

          if (spinTime >= spinDuration) {
            clearInterval(spinInterval);
            setIsSpinning(false);
            setBulletVisible(false);
            setBulletSlot(Math.floor(Math.random() * 6));
          }
        }, 16);
      }, 1000);
    }
  }, [bulletPlaced]);

  const fireGun = useCallback(() => {
    if (bulletSlot !== null && currentSlot === bulletSlot) {
      setIsGameOver(true);
    } else {
      setSafeSlots((prevSafeSlots) => [...prevSafeSlots, currentSlot]);
      setCurrentSlot((prevSlot) => (prevSlot + 1) % 6);
    }
  }, [bulletSlot, currentSlot]);

  const resetGame = useCallback(() => {
    setCurrentRotation(0);
    setBulletSlot(null);
    setSafeSlots([]);
    setBulletPlaced(false);
    setBulletVisible(true);
    setIsGameOver(false);
    setCurrentSlot(0);
    setGameStarted(false);
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    injectBullet();
  }, [injectBullet]);

  const memoizedFPSCounter = useMemo(() => <MemoizedFPSCounter fps={fps} />, [fps]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {memoizedFPSCounter}
      {isGameOver && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-red-500 text-4xl mb-4">Game Over!</p>
          <button
            onClick={resetGame}
            className="mt-4 px-6 py-3 text-xl bg-red-500 text-white border-none cursor-pointer rounded-md hover:bg-red-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="block mx-auto" />

      {!gameStarted && !isGameOver && (
        <button
          onClick={startGame}
          className="mt-6 px-6 py-3 text-xl bg-green-500 text-white border-none cursor-pointer rounded-md hover:bg-green-600 transition-colors"
        >
          Start Game
        </button>
      )}

      {gameStarted && !isGameOver && (
        <button
          onClick={fireGun}
          className="mt-6 px-6 py-3 text-xl bg-orange-500 text-white border-none cursor-pointer rounded-md hover:bg-orange-600 transition-colors"
        >
          Fire
        </button>
      )}
    </div>
  );
};

export default CanvasGame;
