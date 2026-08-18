"use client";

/**
 * The three.js fallback runtime.
 *
 * This satisfies `ExhibitRuntime` in a browser so the exhibit can be built and
 * reviewed without HopeOS hardware. Haptics degrade to the Vibration API where
 * it exists and to nothing where it does not; voice degrades to on-screen
 * buttons and the Web Speech API where available.
 *
 * The geometry is procedural rather than a downloaded scan. A real exhibit
 * would load a photogrammetry mesh through `modelUrl`, but committing a
 * multi-megabyte scan of a contested object to a public repository is not a
 * neutral act, and the demo does not need it: what is being demonstrated is the
 * POI/tier/haptic/voice binding, and that is identical whatever mesh is loaded.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BURA_SCENE,
  coverageNarration,
  intentsForRole,
  poisForRole,
  type HapticProfile,
  type PointOfInterest,
} from "../lib/exhibit";
import type { Role } from "../lib/fixtures";

const ROLES: { role: Role; label: string }[] = [
  { role: "public", label: "Public" },
  { role: "source-community", label: "Source community" },
  { role: "museum", label: "Museum" },
  { role: "enforcement", label: "Enforcement" },
  { role: "owner", label: "Holder" },
];

const HAPTIC_MS: Record<HapticProfile, number[]> = {
  edge: [12],
  texture: [8, 24, 8, 24, 8],
  void: [40, 60, 40],
  seam: [10, 30, 10],
  incision: [6, 12, 6, 12, 6, 12],
};

function vibrate(profile: HapticProfile) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  nav.vibrate(HAPTIC_MS[profile]);
}

/** A stand-in askos: bulbous body, neck, spout, and a quadruped suggestion. */
function buildObject(): THREE.Group {
  const g = new THREE.Group();
  const clay = new THREE.MeshStandardMaterial({
    color: 0x9c6b4a,
    roughness: 0.85,
    metalness: 0.04,
    flatShading: false,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 36), clay);
  body.scale.set(1, 0.86, 0.9);
  g.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.26, 0.5, 32, 1, true),
    clay,
  );
  neck.position.y = 0.62;
  g.add(neck);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 16, 40), clay);
  rim.position.y = 0.87;
  rim.rotation.x = Math.PI / 2;
  g.add(rim);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.045, 14, 40, Math.PI * 1.1),
    clay,
  );
  handle.position.set(-0.42, 0.42, 0);
  handle.rotation.set(Math.PI / 2, 0, Math.PI / 2.2);
  g.add(handle);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.36, 24), clay);
  head.position.set(0.6, 0.28, 0);
  head.rotation.z = -Math.PI / 2.6;
  g.add(head);

  for (const [x, z] of [
    [0.3, 0.3],
    [0.3, -0.3],
    [-0.3, 0.3],
    [-0.3, -0.3],
  ] as [number, number][]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.05, 0.42, 16),
      clay,
    );
    leg.position.set(x, -0.62, z);
    g.add(leg);
  }

  return g;
}

export default function ExhibitViewer({
  score,
  coverageClass,
  identifying,
  totalRegisters,
}: {
  score: number;
  coverageClass: string;
  identifying: number;
  totalRegisters: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const [role, setRole] = useState<Role>("public");
  const [focused, setFocused] = useState<PointOfInterest | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [hapticSupport, setHapticSupport] = useState(false);
  const [speechSupport, setSpeechSupport] = useState(false);

  const visiblePois = poisForRole(BURA_SCENE.pois, role);
  const visibleIntents = intentsForRole(role);

  const narrate = useCallback((text: string) => {
    setTranscript((t) => [text, ...t].slice(0, 6));
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98;
    u.pitch = 1;
    synth.speak(u);
  }, []);

  useEffect(() => {
    setHapticSupport(
      typeof navigator !== "undefined" &&
        typeof (navigator as Navigator & { vibrate?: unknown }).vibrate ===
          "function",
    );
    setSpeechSupport(
      typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined",
    );
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0f12);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.5, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xfff2dd, 1.5);
    key.position.set(3, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-3, 1, -3);
    scene.add(rim);

    const root = new THREE.Group();
    root.add(buildObject());
    scene.add(root);

    const markers = new Map<string, THREE.Object3D>();
    for (const poi of BURA_SCENE.pois) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0xd4a556 }),
      );
      m.position.set(...poi.position);
      m.userData.poiId = poi.id;
      m.visible = false;
      root.add(m);
      markers.set(poi.id, m);
    }
    markersRef.current = markers;

    let dragging = false;
    let px = 0;
    let py = 0;
    let vx = 0.0025;
    let vy = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      vx = (e.clientX - px) * 0.006;
      vy = (e.clientY - py) * 0.006;
      root.rotation.y += vx;
      root.rotation.x = Math.max(
        -0.7,
        Math.min(0.7, root.rotation.x + vy),
      );
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(1.8, Math.min(6, camera.position.z + e.deltaY * 0.002));
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      if (!dragging) root.rotation.y += 0.0022;

      for (const [, m] of markers) {
        if (!m.visible) continue;
        const s = 1 + Math.sin(t * 3) * 0.18;
        m.scale.setScalar(s);
      }

      const target = targetRef.current;
      if (target) {
        const want = new THREE.Vector3(target.x * 0.6, target.y * 0.6 + 0.2, 2.4);
        camera.position.lerp(want, 0.06);
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, []);

  // Marker visibility is a disclosure decision, so it is driven by role.
  useEffect(() => {
    const allowed = new Set(visiblePois.map((p) => p.id));
    for (const [id, m] of markersRef.current) m.visible = allowed.has(id);
    if (focused && !allowed.has(focused.id)) {
      setFocused(null);
      targetRef.current = null;
    }
  }, [role, focused, visiblePois]);

  const focus = useCallback(
    (poi: PointOfInterest) => {
      setFocused(poi);
      targetRef.current = new THREE.Vector3(...poi.position);
      vibrate(poi.haptic);
      narrate(poi.narration);
    },
    [narrate],
  );

  const runIntent = useCallback(
    (intent: string) => {
      if (intent === "coverage") {
        narrate(
          coverageNarration(coverageClass, score, identifying, totalRegisters),
        );
        return;
      }
      const map: Record<string, string> = {
        identify: "spout",
        locate: "body-texture",
        damage: "loss",
        provenance: "abrasion",
        claims: "claim-region",
        "source-voice": "claim-region",
      };
      const poi = visiblePois.find((p) => p.id === map[intent]);
      if (poi) {
        focus(poi);
        return;
      }
      narrate(
        "That is not available at your access level. The exhibit will not show what the passport withholds.",
      );
    },
    [coverageClass, focus, identifying, narrate, score, totalRegisters, visiblePois],
  );

  return (
    <>
      <div className="card">
        <p className="label">Visitor role</p>
        <div className="btn-row">
          {ROLES.map((r) => (
            <button
              key={r.role}
              className={`btn role-${r.role}`}
              data-active={r.role === role}
              onClick={() => setRole(r.role)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="faint">
          {visiblePois.length} of {BURA_SCENE.pois.length} points of interest are
          reachable at this level, and {visibleIntents.length} of 7 voice
          intents. The exhibit enforces the same envelope as the passport,
          because a gallery kiosk that narrates what the API withholds is a data
          breach with better lighting.
        </p>
      </div>

      <div className="exhibit-grid">
        <div className="viewer" ref={mountRef} />

        <div className="stack">
          <div className="card">
            <p className="label">Points of interest</p>
            <ul className="poi-list">
              {visiblePois.map((p) => (
                <li key={p.id}>
                  <button
                    className="btn poi-btn"
                    data-active={focused?.id === p.id}
                    onClick={() => focus(p)}
                  >
                    <span>{p.label}</span>
                    <span className={`tier-tag role-${p.tier}`}>{p.tier}</span>
                    <span className="faint mono-sm">{p.haptic}</span>
                  </button>
                </li>
              ))}
            </ul>
            {visiblePois.length < BURA_SCENE.pois.length ? (
              <p className="withheld">
                {BURA_SCENE.pois.length - visiblePois.length} point
                {BURA_SCENE.pois.length - visiblePois.length === 1 ? "" : "s"} of
                interest withheld at this access level.
              </p>
            ) : null}
          </div>

          <div className="card">
            <p className="label">Voice intents</p>
            <div className="btn-row">
              {visibleIntents.map((i) => (
                <button
                  key={i.intent}
                  className="btn"
                  onClick={() => runIntent(i.intent)}
                >
                  &ldquo;{i.utterances[0]}&rdquo;
                </button>
              ))}
            </div>
            <p className="faint">
              Speech synthesis {speechSupport ? "available" : "unavailable"} ·
              haptics {hapticSupport ? "available" : "unavailable"} in this
              browser. On HopeOS hardware both are native; here they degrade to
              text and to nothing respectively.
            </p>
          </div>

          <div className="card">
            <p className="label">Narration transcript</p>
            {transcript.length === 0 ? (
              <p className="faint">
                Nothing yet. Touch a point of interest or ask a question.
              </p>
            ) : (
              <ol className="transcript">
                {transcript.map((t, i) => (
                  <li key={i} className={i === 0 ? "" : "faint"}>
                    {t}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
