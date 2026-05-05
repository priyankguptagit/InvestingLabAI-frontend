"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    ScrollControls,
    Scroll,
    useScroll,
    Stars,
    Float,
    Sparkles,
    Text,
    MeshTransmissionMaterial,
    Torus
} from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// --- 3D COMPONENTS ---

const Particles = ({ scrollY }: { scrollY: number }) => {
    const ref = useRef<THREE.Points>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y -= delta * 0.05;
            ref.current.rotation.x = (scrollY / 1000) * 0.2;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points />
        </group>
    );
};

const Points = () => {
    const conf = useMemo(() => {
        const count = 300;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            positions.set([x, y, z], i * 3);

            const color = new THREE.Color();
            color.setHSL(Math.random(), 1.0, 0.5);
            colors.set([color.r, color.g, color.b], i * 3);
        }

        return { positions, colors };
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={conf.positions.length / 3} array={conf.positions} itemSize={3} args={[conf.positions, 3]} />
                <bufferAttribute attach="attributes-color" count={conf.colors.length / 3} array={conf.colors} itemSize={3} args={[conf.colors, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} />
        </points>
    );
}

const AbstractShape = ({ scrollY }: { scrollY: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const viewport = useThree(state => state.viewport);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.3;
        meshRef.current.position.y = (scrollY / 100) * -0.5;
    });

    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
            <mesh ref={meshRef} position={[2, 0, 0]} scale={0.8}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <MeshTransmissionMaterial
                    backside
                    backsideThickness={5}
                    thickness={2}
                    chromaticAberration={0.5}
                    anisotropy={0.5}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.5}
                    color="#4f46e5"
                    resolution={1024}
                />
            </mesh>
        </Float>
    )
}

// --- MAIN SCENE ---

interface SceneProps {
    children: React.ReactNode;
}

export default function Scene({ children }: SceneProps) {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="relative w-full overflow-hidden">
            {/* Background Canvas (Fixed) */}
            <div className="fixed inset-0 z-0 bg-[#020617]">
                <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 1.5]}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#818cf8" />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#c084fc" />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Sparkles count={50} scale={10} size={4} speed={0.4} opacity={0.5} color="#6366f1" />

                    <Particles scrollY={scrollY} />
                    <AbstractShape scrollY={scrollY} />
                </Canvas>
            </div>

            {/* Static Content (Scrolls normally) */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}