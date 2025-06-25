import React, { useRef, useState, useEffect } from "react";
import Matter from "matter-js";

interface FallingTextProps {
  text?: string;
  onFallen?: () => void;
  gravity?: number;
  mouseConstraintStiffness?: number;
  highlightWords?: string[];
  highlightClass?: string;
}

const FallingText: React.FC<FallingTextProps> = ({
  text = "",
  onFallen,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  highlightWords = [],
  highlightClass = "highlighted",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } =
      Matter;

    if (
      !containerRef.current ||
      !canvasContainerRef.current
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    if (width <= 0 || height <= 0) {
      return;
    }

    // Hide original text and prepare for physics
    const originalTextEl = textRef.current;
    if (originalTextEl) {
        originalTextEl.classList.add('hidden');
    }

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.y = gravity;

    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: "transparent",
        wireframes: false,
      },
    });

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };
    const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
    const rightWall = Bodies.rectangle( width + 25, height / 2, 50, height, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

    const tempWrapper = document.createElement('div');
    tempWrapper.className = "text-slate-600 dark:text-slate-300 leading-relaxed";
    tempWrapper.style.visibility = 'hidden';
    tempWrapper.style.position = 'absolute';
    
    const words = text.split(" ");
    tempWrapper.innerHTML = words.map(word => {
        const isHighlighted = highlightWords.includes(word);
        return `<span class="word ${isHighlighted ? highlightClass : ''}">${word}</span>`;
    }).join(" ");

    containerRef.current.appendChild(tempWrapper);
    
    const wordSpans = tempWrapper.querySelectorAll<HTMLSpanElement>(".word");

    const wordBodies = Array.from(wordSpans).map((elem) => {
      const rect = elem.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      
      const newElem = elem.cloneNode(true) as HTMLSpanElement;
      containerRef.current?.appendChild(newElem);
      
      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: 0.6,
        frictionAir: 0.01,
        friction: 0.1,
      });

      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      return { elem: newElem, body };
    });

    containerRef.current.removeChild(tempWrapper);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    });

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);
    
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.position = 'absolute';
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      animationFrameId.current = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    const fallenTimer = setTimeout(() => {
        onFallen?.();
    }, 4000); // Consider text fallen after 4 seconds

    return () => {
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      clearTimeout(fallenTimer);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
          render.canvas.remove();
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [text, gravity, mouseConstraintStiffness, onFallen, highlightWords, highlightClass]);

  return (
    <div
      ref={containerRef}
      className="falling-text-container"
      style={{ position: "absolute", inset: 0 }}
    >
      <div
        ref={textRef}
        className="falling-text-target text-slate-600 dark:text-slate-300 leading-relaxed"
      >
        {text}
      </div>
      <div ref={canvasContainerRef} className="falling-text-canvas" />
    </div>
  );
};

export default FallingText;
