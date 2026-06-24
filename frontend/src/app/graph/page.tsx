"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { getConfidenceColor, tokens } from "@/lib/design-tokens";
import { getGraphSnapshot, forgetNode, getConflictEvents } from "@/lib/api";
import * as THREE from "three";
import type { GraphNode, GraphEdge } from "@/lib/types";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d").then((m) => m.default || m), { ssr: false });

interface NodeDetail extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
}

const COLORS = {
  active: "#5e6ad2",
  superseded: "#7a7fad",
  rejected: "#e05252",
  forgotten: "#3e3e44",
  edge: "#2a2a30",
  particle: "#8a8f98",
  fresh: "#5e6ad2",
  fading: "#7a7fad",
  stale: "#3e3e44",
};

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.15, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function nodeColor(node: GraphNode) {
  const level = getConfidenceColor(node.confidenceScore);
  if (level === "fresh") return COLORS.fresh;
  if (level === "fading") return COLORS.fading;
  return COLORS.stale;
}

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  const fgRef = useRef<any>(null);
  const glowTexRef = useRef<THREE.CanvasTexture | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
         const { width, height } = entries[0].contentRect;
         setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    glowTexRef.current = createGlowTexture();
    const load = async () => {
      try {
        const [data, events] = await Promise.all([
          getGraphSnapshot(),
          getConflictEvents(),
        ]);
        setNodes(data.nodes);
        setEdges(data.edges);
        setConflictCount(events.filter((e) => e.status === "pending").length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load graph");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode({
      id: node.id,
      label: node.label,
      summary: node.summary || "",
      confidenceScore: node.confidenceScore ?? 0.5,
      sourceProvenance: node.sourceProvenance || "",
      lastReinforcedAt: node.lastReinforcedAt || "",
      connectionCount: node.connectionCount || 0,
      status: node.status || "active",
      isDecisionType: node.isDecisionType || false,
    });
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * 1.4, y: node.y * 1.4, z: node.z * 1.4 + 80 },
        { x: node.x, y: node.y, z: node.z },
        800,
      );
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 250 }, { x: 0, y: 0, z: 0 }, 800);
    }
  }, []);

  const handleForgetNode = useCallback(async () => {
    if (!selectedNode) return;
    try {
      await forgetNode(selectedNode.id);
      setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
      setEdges((prev) => prev.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    } catch {}
  }, [selectedNode]);

  const nodeThreeObject = useCallback(
    (node: any) => {
      const color = nodeColor(node);
      const group = new THREE.Group();

      const sphereGeo = new THREE.SphereGeometry(node.isDecisionType ? 8 : 6, 32, 32);
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(sphere);

      if (glowTexRef.current) {
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTexRef.current,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.85,
          color,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(45, 45, 1);
        group.add(sprite);
      }

      const haloGeo = new THREE.TorusGeometry(node.isDecisionType ? 14 : 11, 0.4, 16, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      group.add(halo);

      return group;
    },
    [],
  );

  const linkThreeObject = useCallback((link: any) => {
    const color = link.confidence >= 0.8 ? COLORS.particle : COLORS.edge;
    const geo = new THREE.BufferGeometry();
    const points = [link.source.x || 0, link.source.y || 0, link.source.z || 0, link.target.x || 0, link.target.y || 0, link.target.z || 0];
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
    return new THREE.Line(geo, mat);
  }, []);

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n, id: n.id, label: n.label })),
      links: edges.map((e) => ({ source: e.source, target: e.target, confidence: e.confidence })),
    }),
    [nodes, edges],
  );

  const empty = !loading && nodes.length === 0 && !error;

  useEffect(() => {
    if (fgRef.current && !empty && !loading && graphData.nodes.length > 0) {
      const scene = fgRef.current.scene();
      if (!scene.getObjectByName("starfield")) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 3000; i++) {
          vertices.push(THREE.MathUtils.randFloatSpread(4000));
          vertices.push(THREE.MathUtils.randFloatSpread(4000));
          vertices.push(THREE.MathUtils.randFloatSpread(4000));
        }
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ 
          color: 0xffffff, 
          size: 1.5, 
          transparent: true, 
          opacity: 0.4,
          sizeAttenuation: true
        });
        const points = new THREE.Points(geometry, material);
        points.name = "starfield";
        scene.add(points);
      }
    }
  }, [empty, loading, graphData]);

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden relative">
      <div ref={containerRef} className="flex-1 relative h-full w-full min-w-0 min-h-0" onDoubleClick={handleBackgroundClick}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-ink-subtle">Loading graph...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <EmptyState icon="graph" title="Could not load graph" description={error} />
          </div>
        )}

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <EmptyState
              icon="graph"
              title="Your graph is empty"
              description="Ingest a GitHub repo, paste a conversation, or upload a PDF to start building your knowledge graph."
            />
          </div>
        )}

        {!empty && !loading && !error && (
          <>
            {dimensions.width > 0 && dimensions.height > 0 && (
              <ForceGraph3D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeThreeObject={nodeThreeObject}
              linkThreeObject={linkThreeObject}
              linkWidth={0.8}
              linkOpacity={0.25}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleColor={() => COLORS.particle}
              linkCurvature={0.1}
              onNodeClick={handleNodeClick}
              backgroundColor="#010102"
              nodeLabel="label"
              nodeResolution={24}
              d3VelocityDecay={0.3}
              d3AlphaDecay={0.02}
                warmupTicks={100}
                cooldownTicks={30}
                rendererConfig={{ antialias: true, alpha: true }}
              />
            )}

            <div className="absolute bottom-20 md:bottom-6 left-4 md:left-6 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 px-4 py-2.5 rounded-lg bg-surface-1/80 backdrop-blur-sm border border-hairline z-10 pointer-events-none md:pointer-events-auto">
              <span className="text-[10px] md:text-xs text-ink-subtle font-medium uppercase tracking-wider md:normal-case md:tracking-normal">Memory Health</span>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-confidence-fresh shadow-[0_0_6px_rgba(94,106,210,0.8)]" />
                  <span className="text-xs text-ink-tertiary">Fresh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-confidence-fading" />
                  <span className="text-xs text-ink-tertiary">Fading</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-confidence-stale" />
                  <span className="text-xs text-ink-tertiary">Stale</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex absolute top-6 left-6 items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1/60 backdrop-blur-sm border border-hairline z-10 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#8a8f98" strokeWidth="1" />
                <path d="M6 3V6L8 8" stroke="#8a8f98" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-ink-tertiary">Drag to orbit &middot; Scroll to zoom &middot; Click a node</span>
            </div>

            <Link
              href="/resolve"
              className="absolute top-4 md:top-6 right-4 md:right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1/80 backdrop-blur-sm border border-hairline z-10 hover:bg-surface-1 transition-colors duration-150 cursor-pointer shadow-lg md:shadow-none"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#e0a328" strokeWidth="1.3" />
                <path d="M7 4V7.5M7 10V10.01" stroke="#e0a328" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-ink-muted">What Changed</span>
              {conflictCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-conflict-warning/20 border border-conflict-warning/30 text-xs font-medium text-conflict-warning">
                  {conflictCount}
                </span>
              )}
            </Link>
          </>
        )}
      </div>

      {selectedNode && !empty && (
        <div className="absolute inset-x-0 bottom-0 top-auto md:relative md:w-[380px] md:h-full border-t md:border-t-0 md:border-l border-hairline bg-surface-1/95 md:bg-surface-1 backdrop-blur-xl md:backdrop-blur-none overflow-y-auto scrollbar-thin z-20 max-h-[60vh] md:max-h-full rounded-t-2xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-none">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(94,106,210,0.6)]"
                  style={{ backgroundColor: nodeColor(selectedNode) }}
                />
                <h3 className="text-base font-semibold text-ink tracking-tight">{selectedNode.label}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  if (fgRef.current) fgRef.current.cameraPosition({ x: 0, y: 0, z: 250 }, { x: 0, y: 0, z: 0 }, 800);
                }}
                className="text-ink-tertiary hover:text-ink transition-colors duration-150 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-ink-tertiary uppercase tracking-wider">Confidence</span>
                <div className="mt-1">
                  <ConfidenceBadge level={getConfidenceColor(selectedNode.confidenceScore)} score={selectedNode.confidenceScore} />
                </div>
              </div>

              {selectedNode.summary && (
                <div>
                  <span className="text-xs text-ink-tertiary uppercase tracking-wider">Summary</span>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">{selectedNode.summary}</p>
                </div>
              )}

              {selectedNode.sourceProvenance && (
                <div>
                  <span className="text-xs text-ink-tertiary uppercase tracking-wider">Source</span>
                  <p className="mt-1 text-sm text-ink-muted">{selectedNode.sourceProvenance}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-ink-tertiary uppercase tracking-wider">Last reinforced</span>
                <p className="mt-1 text-sm text-ink-muted">{selectedNode.lastReinforcedAt || "Unknown"}</p>
              </div>

              <div>
                <span className="text-xs text-ink-tertiary uppercase tracking-wider">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium ${
                      selectedNode.status === "active"
                        ? "bg-semantic-success/10 text-semantic-success"
                        : selectedNode.status === "superseded"
                          ? "bg-conflict-warning/10 text-conflict-warning"
                          : "bg-surface-3 text-ink-tertiary"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedNode.status === "active"
                          ? "bg-semantic-success"
                          : selectedNode.status === "superseded"
                            ? "bg-conflict-warning"
                            : "bg-ink-tertiary"
                      }`}
                    />
                    {selectedNode.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-hairline">
              <button
                onClick={handleForgetNode}
                className="w-full px-4 py-2 rounded-md bg-semantic-danger/10 text-semantic-danger text-sm font-medium hover:bg-semantic-danger/20 transition-colors duration-150 cursor-pointer"
              >
                Forget this node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
