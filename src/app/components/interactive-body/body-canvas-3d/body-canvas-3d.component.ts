import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface HotspotPosition {
  pos: THREE.Vector3;
  side: 'back' | 'front' | 'both';
}

interface HotspotConfig {
  id: string;
  name: string;
  number: string;
  nodes: HotspotPosition[];
  preferredView: 'back' | 'front';
}

@Component({
  selector: 'app-body-canvas-3d',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="canvas-3d-wrapper" #wrapper>
      <!-- Top 3D Control Bar -->
      <div class="controls-overlay">
        <div class="view-pill">
          <button
            type="button"
            class="view-btn"
            [class.active]="currentAngleView() === 'back'"
            (click)="rotateTo('back')"
            title="Ver espalda"
          >
            Espalda
          </button>
          <button
            type="button"
            class="view-btn"
            [class.active]="currentAngleView() === 'front'"
            (click)="rotateTo('front')"
            title="Ver frente"
          >
            Frente
          </button>
        </div>

        <div class="actions-pill">
          <button
            type="button"
            class="action-btn"
            [class.active]="isAutoRotating()"
            (click)="toggleAutoRotate()"
            title="Girar automáticamente 360°"
          >
            <app-icon name="compass" [size]="14" />
            <span class="btn-text">360°</span>
          </button>
          <button
            type="button"
            class="action-btn"
            (click)="resetView()"
            title="Restablecer vista"
          >
            <app-icon name="activity" [size]="14" />
          </button>
        </div>
      </div>

      <!-- Canvas Element -->
      <canvas #canvas3d class="three-canvas"></canvas>

      <!-- Hover / Selected Floating Tooltip -->
      @if (hoveredZone()) {
        <div 
          class="zone-tooltip" 
          [style.left.px]="tooltipPos().x" 
          [style.top.px]="tooltipPos().y"
        >
          <span class="tooltip-num">{{ hoveredZone()?.number }}</span>
          <span class="tooltip-name">{{ hoveredZone()?.name }}</span>
          <span class="tooltip-action">Toca para evaluar</span>
        </div>
      }

      <!-- Interactive User Guide Badge -->
      <div class="interaction-guide" [class.fade-out]="hasInteracted()">
        <span class="guide-hand">👆</span>
        <span>Arrastra para rotar en 3D · Toca un punto numérico</span>
      </div>
    </div>
  `,
  styleUrl: './body-canvas-3d.component.scss'
})
export class BodyCanvas3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapper', { static: true }) wrapperRef!: ElementRef<HTMLDivElement>;

  @Input() activeZoneId: string = 'cuello';
  @Output() zoneSelected = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'front' | 'back'>();

  private readonly themeService = inject(ThemeService);

  readonly currentAngleView = signal<'front' | 'back'>('back');
  readonly isAutoRotating = signal<boolean>(false);
  readonly hasInteracted = signal<boolean>(false);
  readonly hoveredZone = signal<HotspotConfig | null>(null);
  readonly tooltipPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  // Three.js instances
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isVisible: boolean = true;
  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;

  // 3D Scene Groups
  private bodyGroup!: THREE.Group;
  private bodyMeshGroup!: THREE.Group;
  private hotspotsGroup!: THREE.Group;
  private particlesGroup!: THREE.Points;
  private activeZoneLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;

  // Materials to track for theme updates & disposal
  private bodyMaterial!: THREE.MeshPhysicalMaterial;
  private spineMaterial!: THREE.MeshStandardMaterial;

  // Interaction & Rotation state
  private targetRotationY: number = Math.PI; // default facing back
  private targetRotationX: number = 0;
  private isDragging: boolean = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private lastInteractionTime: number = Date.now();

  // Hotspots definitions with side orientation
  private readonly hotspotsData: HotspotConfig[] = [
    {
      id: 'cuello',
      name: 'Cuello & Cervicales',
      number: '1',
      nodes: [
        { pos: new THREE.Vector3(0, 1.72, -0.16), side: 'back' },
        { pos: new THREE.Vector3(0, 1.72, 0.16), side: 'front' }
      ],
      preferredView: 'back'
    },
    {
      id: 'hombros',
      name: 'Hombros & Trapecios',
      number: '2',
      nodes: [
        { pos: new THREE.Vector3(-0.46, 1.50, 0), side: 'both' },
        { pos: new THREE.Vector3(0.46, 1.50, 0), side: 'both' }
      ],
      preferredView: 'back'
    },
    {
      id: 'espalda-alta',
      name: 'Espalda Alta & Dorsales',
      number: '3',
      nodes: [
        { pos: new THREE.Vector3(0, 1.34, -0.22), side: 'back' }
      ],
      preferredView: 'back'
    },
    {
      id: 'espalda-baja',
      name: 'Espalda Baja & Lumbar',
      number: '4',
      nodes: [
        { pos: new THREE.Vector3(0, 0.88, -0.21), side: 'back' }
      ],
      preferredView: 'back'
    },
    {
      id: 'brazos-manos',
      name: 'Brazos, Antebrazos & Manos',
      number: '5',
      nodes: [
        { pos: new THREE.Vector3(-0.58, 0.68, 0.08), side: 'front' },
        { pos: new THREE.Vector3(0.58, 0.68, 0.08), side: 'front' }
      ],
      preferredView: 'front'
    },
    {
      id: 'piernas',
      name: 'Piernas & Gemelos',
      number: '6',
      nodes: [
        { pos: new THREE.Vector3(-0.18, -0.52, -0.14), side: 'back' },
        { pos: new THREE.Vector3(0.18, -0.52, -0.14), side: 'back' },
        { pos: new THREE.Vector3(-0.18, 0.20, 0.16), side: 'front' },
        { pos: new THREE.Vector3(0.18, 0.20, 0.16), side: 'front' }
      ],
      preferredView: 'back'
    }
  ];

  private hotspotMeshes: {
    config: HotspotConfig;
    nodeGroup: THREE.Group;
    hitMesh: THREE.Mesh;
    coreMesh: THREE.Mesh;
    pulseRing: THREE.Mesh;
    haloRing: THREE.Mesh;
    badgeSprite: THREE.Sprite;
    side: 'back' | 'front' | 'both';
  }[] = [];

  constructor() {
    // React to theme changes
    effect(() => {
      const isDark = this.themeService.isDark();
      this.updateThemeMaterials(isDark);
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      setTimeout(() => this.initThree(), 0);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.removeEventListeners();
    this.disposeThree();
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const wrapper = this.wrapperRef.nativeElement;
    const width = wrapper.clientWidth || 320;
    const height = wrapper.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera with graceful breathing room
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    this.camera.position.set(0, 0.50, 5.15);
    this.camera.lookAt(0, 0.48, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lights
    this.setupLights();

    // 5. Build 3D Mannequin & Spine
    this.buildBodyModel();

    // 6. Build Interactive Hotspots
    this.buildHotspots();

    // 7. Ambient Wellness Dust Particles
    this.buildParticles();

    // 8. Ground Soft Aura Disc
    this.buildGroundAura();

    // 9. Initial orientation
    this.bodyGroup.rotation.y = this.targetRotationY;

    // 10. Setup Observers & Listeners
    this.setupEventListeners();
    this.setupObservers();

    // 11. Initial theme update
    this.updateThemeMaterials(this.themeService.isDark());

    // 12. Start Animation Loop
    this.animate();
  }

  private setupLights(): void {
    // Ambient soft warm spa light
    this.ambientLight = new THREE.AmbientLight(0xf7f2e8, 0.85);
    this.scene.add(this.ambientLight);

    // Key Light from front-right
    this.keyLight = new THREE.DirectionalLight(0xfffaee, 1.8);
    this.keyLight.position.set(2.8, 3.5, 3.2);
    this.scene.add(this.keyLight);

    // Fill Botanical Back-Rim Light
    this.fillLight = new THREE.DirectionalLight(0xafc4a8, 1.3);
    this.fillLight.position.set(-2.6, 2.0, -2.6);
    this.scene.add(this.fillLight);

    // Dynamic Point Light that moves to active zone
    this.activeZoneLight = new THREE.PointLight(0x2e6f58, 2.8, 2.5);
    this.activeZoneLight.position.set(0, 1.5, -0.5);
    this.scene.add(this.activeZoneLight);
  }

  private buildBodyModel(): void {
    this.bodyGroup = new THREE.Group();
    this.bodyMeshGroup = new THREE.Group();

    const isDark = this.themeService.isDark();

    // Stylized porcelain / jade spa material
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x143329 : 0xf2ece1,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      reflectivity: 0.5
    });

    // 1. Head (Sculpted oval)
    const headGeo = new THREE.SphereGeometry(0.27, 32, 24);
    headGeo.scale(0.88, 1.15, 0.94);
    const headMesh = new THREE.Mesh(headGeo, this.bodyMaterial);
    headMesh.position.set(0, 1.95, 0);
    this.bodyMeshGroup.add(headMesh);

    // 2. Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.28, 24);
    const neckMesh = new THREE.Mesh(neckGeo, this.bodyMaterial);
    neckMesh.position.set(0, 1.68, 0);
    this.bodyMeshGroup.add(neckMesh);

    // 3. Upper Torso (Chest & Scapula)
    const chestGeo = new THREE.CylinderGeometry(0.40, 0.33, 0.44, 32);
    chestGeo.scale(1.18, 1.0, 0.72);
    const chestMesh = new THREE.Mesh(chestGeo, this.bodyMaterial);
    chestMesh.position.set(0, 1.35, 0);
    this.bodyMeshGroup.add(chestMesh);

    // Shoulder cap curve
    const shoulderArchGeo = new THREE.SphereGeometry(0.36, 24, 16);
    shoulderArchGeo.scale(1.22, 0.45, 0.7);
    const shoulderArchMesh = new THREE.Mesh(shoulderArchGeo, this.bodyMaterial);
    shoulderArchMesh.position.set(0, 1.48, 0);
    this.bodyMeshGroup.add(shoulderArchMesh);

    // 4. Mid Torso (Waist / Core)
    const waistGeo = new THREE.CylinderGeometry(0.33, 0.31, 0.34, 32);
    waistGeo.scale(1.02, 1.0, 0.68);
    const waistMesh = new THREE.Mesh(waistGeo, this.bodyMaterial);
    waistMesh.position.set(0, 0.98, 0);
    this.bodyMeshGroup.add(waistMesh);

    // 5. Pelvis / Hips
    const hipsGeo = new THREE.CylinderGeometry(0.31, 0.36, 0.36, 32);
    hipsGeo.scale(1.12, 1.0, 0.74);
    const hipsMesh = new THREE.Mesh(hipsGeo, this.bodyMaterial);
    hipsMesh.position.set(0, 0.65, 0);
    this.bodyMeshGroup.add(hipsMesh);

    // 6. Shoulders (Deltoids)
    const shoulderGeo = new THREE.SphereGeometry(0.135, 20, 20);
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    leftShoulder.position.set(-0.46, 1.48, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    rightShoulder.position.set(0.46, 1.48, 0);
    this.bodyMeshGroup.add(leftShoulder, rightShoulder);

    // 7. Arms
    const upperArmGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.42, 20);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, this.bodyMaterial);
    leftUpperArm.position.set(-0.50, 1.20, 0);
    leftUpperArm.rotation.z = 0.15;

    const rightUpperArm = new THREE.Mesh(upperArmGeo, this.bodyMaterial);
    rightUpperArm.position.set(0.50, 1.20, 0);
    rightUpperArm.rotation.z = -0.15;
    this.bodyMeshGroup.add(leftUpperArm, rightUpperArm);

    // Elbows
    const elbowGeo = new THREE.SphereGeometry(0.075, 16, 16);
    const leftElbow = new THREE.Mesh(elbowGeo, this.bodyMaterial);
    leftElbow.position.set(-0.54, 0.95, 0);
    const rightElbow = new THREE.Mesh(elbowGeo, this.bodyMaterial);
    rightElbow.position.set(0.54, 0.95, 0);
    this.bodyMeshGroup.add(leftElbow, rightElbow);

    // Forearms
    const forearmGeo = new THREE.CylinderGeometry(0.07, 0.055, 0.38, 20);
    const leftForearm = new THREE.Mesh(forearmGeo, this.bodyMaterial);
    leftForearm.position.set(-0.57, 0.72, 0.03);
    leftForearm.rotation.z = 0.10;

    const rightForearm = new THREE.Mesh(forearmGeo, this.bodyMaterial);
    rightForearm.position.set(0.57, 0.72, 0.03);
    rightForearm.rotation.z = -0.10;
    this.bodyMeshGroup.add(leftForearm, rightForearm);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.055, 16, 16);
    handGeo.scale(0.7, 1.4, 0.5);
    const leftHand = new THREE.Mesh(handGeo, this.bodyMaterial);
    leftHand.position.set(-0.60, 0.48, 0.05);

    const rightHand = new THREE.Mesh(handGeo, this.bodyMaterial);
    rightHand.position.set(0.60, 0.48, 0.05);
    this.bodyMeshGroup.add(leftHand, rightHand);

    // 8. Legs
    const thighGeo = new THREE.CylinderGeometry(0.135, 0.095, 0.58, 24);
    const leftThigh = new THREE.Mesh(thighGeo, this.bodyMaterial);
    leftThigh.position.set(-0.18, 0.22, 0);

    const rightThigh = new THREE.Mesh(thighGeo, this.bodyMaterial);
    rightThigh.position.set(0.18, 0.22, 0);
    this.bodyMeshGroup.add(leftThigh, rightThigh);

    // Knees
    const kneeGeo = new THREE.SphereGeometry(0.095, 20, 20);
    const leftKnee = new THREE.Mesh(kneeGeo, this.bodyMaterial);
    leftKnee.position.set(-0.18, -0.12, 0.02);

    const rightKnee = new THREE.Mesh(kneeGeo, this.bodyMaterial);
    rightKnee.position.set(0.18, -0.12, 0.02);
    this.bodyMeshGroup.add(leftKnee, rightKnee);

    // Calves
    const calfGeo = new THREE.CylinderGeometry(0.095, 0.065, 0.56, 24);
    const leftCalf = new THREE.Mesh(calfGeo, this.bodyMaterial);
    leftCalf.position.set(-0.18, -0.48, 0);

    const rightCalf = new THREE.Mesh(calfGeo, this.bodyMaterial);
    rightCalf.position.set(0.18, -0.48, 0);
    this.bodyMeshGroup.add(leftCalf, rightCalf);

    // Feet
    const footGeo = new THREE.SphereGeometry(0.07, 16, 16);
    footGeo.scale(0.8, 0.6, 1.7);
    const leftFoot = new THREE.Mesh(footGeo, this.bodyMaterial);
    leftFoot.position.set(-0.18, -0.82, 0.06);

    const rightFoot = new THREE.Mesh(footGeo, this.bodyMaterial);
    rightFoot.position.set(0.18, -0.82, 0.06);
    this.bodyMeshGroup.add(leftFoot, rightFoot);

    // 9. Physiological Spine Column (Highlighted Discs on Back)
    this.spineMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e6f58,
      emissive: 0x1e5c46,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    const discGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.022, 16);
    discGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 14; i++) {
      const disc = new THREE.Mesh(discGeo, this.spineMaterial);
      const t = i / 13;
      const y = 1.70 - t * (1.70 - 0.58);
      // Slight anatomical curve of spine (cervical lordosis, thoracic kyphosis, lumbar lordosis)
      const curve = Math.sin(t * Math.PI) * 0.04;
      const z = -0.16 - curve;
      disc.position.set(0, y, z);
      this.bodyMeshGroup.add(disc);
    }

    this.bodyGroup.add(this.bodyMeshGroup);
    this.scene.add(this.bodyGroup);
  }

  private buildHotspots(): void {
    this.hotspotsGroup = new THREE.Group();

    this.hotspotsData.forEach((config) => {
      config.nodes.forEach(nodeInfo => {
        const nodeGroup = new THREE.Group();
        nodeGroup.position.copy(nodeInfo.pos);

        // Invisible Raycasting Sphere
        const hitGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.userData = { config, zoneId: config.id };
        nodeGroup.add(hitMesh);

        // Luminous Core Sphere
        const coreGeo = new THREE.SphereGeometry(0.055, 20, 20);
        const isSelected = config.id === this.activeZoneId;
        const coreMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x123c32 : 0x1e5c46,
          emissive: isSelected ? 0x2e6f58 : 0x1e5c46,
          emissiveIntensity: isSelected ? 1.8 : 0.8,
          roughness: 0.2
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        nodeGroup.add(coreMesh);

        // Pulse Ring
        const ringGeo = new THREE.RingGeometry(0.075, 0.105, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xafc4a8,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });
        const pulseRing = new THREE.Mesh(ringGeo, ringMat);
        nodeGroup.add(pulseRing);

        // Halo Ring
        const haloGeo = new THREE.RingGeometry(0.12, 0.14, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x2e6f58,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        const haloRing = new THREE.Mesh(haloGeo, haloMat);
        nodeGroup.add(haloRing);

        // 3D Number Badge Sprite - elevated slightly above glowing core with depthTest disabled
        const badgeSprite = this.createNumberBadgeSprite(config.number);
        badgeSprite.position.set(0, 0.10, 0);
        badgeSprite.scale.set(0.18, 0.18, 1);
        nodeGroup.add(badgeSprite);

        this.hotspotMeshes.push({
          config,
          nodeGroup,
          hitMesh,
          coreMesh,
          pulseRing,
          haloRing,
          badgeSprite,
          side: nodeInfo.side
        });

        this.hotspotsGroup.add(nodeGroup);
      });
    });

    this.bodyGroup.add(this.hotspotsGroup);
  }

  private createNumberBadgeSprite(numberStr: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Outer circle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#123C32';
    ctx.fill();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#AFC4A8';
    ctx.stroke();

    // Number text
    ctx.fillStyle = '#FCFAF6';
    ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numberStr, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.renderOrder = 999;
    return sprite;
  }

  private buildParticles(): void {
    const particleCount = 42;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 0.4 + Math.random() * 0.9;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.9 + Math.random() * 3.0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xafc4a8,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.particlesGroup = new THREE.Points(geometry, material);
    this.scene.add(this.particlesGroup);
  }

  private buildGroundAura(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(30, 92, 70, 0.28)');
    grad.addColorStop(0.5, 'rgba(175, 196, 168, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(2.0, 2.0);
    planeGeo.rotateX(-Math.PI / 2);

    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    const groundMesh = new THREE.Mesh(planeGeo, planeMat);
    groundMesh.position.set(0, -0.95, 0);
    this.scene.add(groundMesh);
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    // Pointer events for desktop & touch
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private removeEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas?.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    window.removeEventListener('pointermove', this.onPointerMove.bind(this));
    window.removeEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private setupObservers(): void {
    // 1. Intersection Observer: pause when off-screen
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0, rootMargin: '120px 0px' });

    this.intersectionObserver.observe(this.wrapperRef.nativeElement);

    // 2. Resize Observer: update aspect ratio smoothly
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });

    this.resizeObserver.observe(this.wrapperRef.nativeElement);
  }

  // Pointer Handlers
  private onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.previousPointerPosition = { x: event.clientX, y: event.clientY };
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
    this.hasInteracted.set(true);
    this.lastInteractionTime = Date.now();
  }

  private onPointerMove(event: PointerEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Normalized coordinates for Raycasting
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging) {
      const deltaX = event.clientX - this.previousPointerPosition.x;
      const deltaY = event.clientY - this.previousPointerPosition.y;

      this.targetRotationY += deltaX * 0.009;
      if (event.pointerType !== 'touch') {
        this.targetRotationX += deltaY * 0.006;
        this.targetRotationX = Math.max(-0.35, Math.min(0.35, this.targetRotationX));
      }

      this.previousPointerPosition = { x: event.clientX, y: event.clientY };
      this.lastInteractionTime = Date.now();
    } else {
      // Raycasting hover check
      this.checkHover(event, rect);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const dist = Math.hypot(
      event.clientX - this.pointerDownPos.x,
      event.clientY - this.pointerDownPos.y
    );

    // Click trigger if barely moved (< 6px)
    if (dist < 6) {
      this.checkClick();
    }

    this.isDragging = false;
  }

  private checkHover(event: PointerEvent, rect: DOMRect): void {
    if (this.mouse.x < -1 || this.mouse.x > 1 || this.mouse.y < -1 || this.mouse.y > 1) {
      this.hoveredZone.set(null);
      this.canvasRef.nativeElement.style.cursor = 'grab';
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = this.hotspotMeshes.filter(h => h.nodeGroup.visible).map(h => h.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const config = hit.userData['config'] as HotspotConfig;
      this.hoveredZone.set(config);
      this.tooltipPos.set({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 45
      });
      this.canvasRef.nativeElement.style.cursor = 'pointer';
    } else {
      this.hoveredZone.set(null);
      this.canvasRef.nativeElement.style.cursor = this.isDragging ? 'grabbing' : 'grab';
    }
  }

  private checkClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = this.hotspotMeshes.filter(h => h.nodeGroup.visible).map(h => h.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const config = hit.userData['config'] as HotspotConfig;
      this.onZoneClicked(config);
    }
  }

  private onZoneClicked(config: HotspotConfig): void {
    this.hasInteracted.set(true);
    this.zoneSelected.emit(config.id);

    // Smoothly orient model if back/front is opposite
    const currentNormY = ((this.bodyGroup.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const isFacingBack = currentNormY > Math.PI * 0.5 && currentNormY < Math.PI * 1.5;

    if (config.preferredView === 'front' && isFacingBack) {
      this.rotateTo('front');
    } else if (config.preferredView === 'back' && !isFacingBack) {
      this.rotateTo('back');
    }

    this.updateActiveHotspotVisuals(config.id);
  }

  // Visual state updates when active zone changes from outside or inside
  updateActiveHotspotVisuals(zoneId: string): void {
    this.activeZoneId = zoneId;

    let targetPos: THREE.Vector3 | null = null;

    this.hotspotMeshes.forEach(h => {
      const isSelected = h.config.id === zoneId;
      const coreMat = h.coreMesh.material as THREE.MeshStandardMaterial;
      coreMat.color.setHex(isSelected ? 0x123c32 : 0x1e5c46);
      coreMat.emissive.setHex(isSelected ? 0x2e6f58 : 0x1e5c46);
      coreMat.emissiveIntensity = isSelected ? 2.2 : 0.8;

      if (isSelected && !targetPos && h.config.nodes.length > 0) {
        targetPos = h.config.nodes[0].pos;
      }
    });

    if (targetPos) {
      this.activeZoneLight.position.copy(targetPos).add(new THREE.Vector3(0, 0, -0.2));
    }
  }

  // Public controls
  rotateTo(view: 'front' | 'back'): void {
    this.hasInteracted.set(true);
    this.currentAngleView.set(view);
    this.viewModeChange.emit(view);

    if (view === 'back') {
      this.targetRotationY = Math.PI;
    } else {
      this.targetRotationY = 0;
    }
    this.targetRotationX = 0;
  }

  toggleAutoRotate(): void {
    this.hasInteracted.set(true);
    this.isAutoRotating.update(v => !v);
  }

  resetView(): void {
    this.rotateTo('back');
    this.isAutoRotating.set(false);
  }

  private updateThemeMaterials(isDark: boolean): void {
    if (!this.bodyMaterial || !this.spineMaterial) return;

    if (isDark) {
      this.bodyMaterial.color.setHex(0x143329);
      this.bodyMaterial.roughness = 0.25;
      this.bodyMaterial.metalness = 0.15;
      this.bodyMaterial.clearcoat = 0.85;

      this.spineMaterial.color.setHex(0x25e59c);
      this.spineMaterial.emissive.setHex(0x1e5c46);
      this.spineMaterial.emissiveIntensity = 1.2;

      this.ambientLight?.color.setHex(0x0c1e18);
      this.keyLight?.color.setHex(0x9fc0b0);
      this.fillLight?.color.setHex(0x356350);
    } else {
      this.bodyMaterial.color.setHex(0xf2ece1);
      this.bodyMaterial.roughness = 0.32;
      this.bodyMaterial.metalness = 0.05;
      this.bodyMaterial.clearcoat = 0.7;

      this.spineMaterial.color.setHex(0x2e6f58);
      this.spineMaterial.emissive.setHex(0x1e5c46);
      this.spineMaterial.emissiveIntensity = 0.8;

      this.ambientLight?.color.setHex(0xf7f2e8);
      this.keyLight?.color.setHex(0xfffaee);
      this.fillLight?.color.setHex(0xafc4a8);
    }
  }

  // Animation Loop
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.isVisible) return;

    const time = performance.now() * 0.001;

    // 1. Smooth rotation damping
    if (this.isAutoRotating()) {
      this.targetRotationY += 0.008;
    }

    this.bodyGroup.rotation.y += (this.targetRotationY - this.bodyGroup.rotation.y) * 0.08;
    this.bodyGroup.rotation.x += (this.targetRotationX - this.bodyGroup.rotation.x) * 0.08;

    // Determine current facing for UI indicator
    const normRot = ((this.bodyGroup.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normRot > Math.PI * 0.5 && normRot < Math.PI * 1.5) {
      if (this.currentAngleView() !== 'back') this.currentAngleView.set('back');
    } else {
      if (this.currentAngleView() !== 'front') this.currentAngleView.set('front');
    }

    // 2. Subtle organic breathing floating motion
    this.bodyGroup.position.y = Math.sin(time * 1.4) * 0.035;

    // Side visibility based on current angle
    const isFacingBack = normRot > Math.PI * 0.35 && normRot < Math.PI * 1.65;

    // 3. Hotspot Pulse & Rings Animation
    this.hotspotMeshes.forEach((h, idx) => {
      // Determine visibility by side orientation
      if (h.side === 'back') {
        h.nodeGroup.visible = isFacingBack;
      } else if (h.side === 'front') {
        h.nodeGroup.visible = !isFacingBack;
      } else {
        h.nodeGroup.visible = true;
      }

      if (!h.nodeGroup.visible) return;

      const isSelected = h.config.id === this.activeZoneId;
      const isHovered = this.hoveredZone()?.id === h.config.id;

      // Make rings face camera
      h.pulseRing.quaternion.copy(this.camera.quaternion);
      h.haloRing.quaternion.copy(this.camera.quaternion);

      // Pulse ring scaling
      const pulseSpeed = isSelected ? 3.5 : 2.0;
      const pulseScale = (1.0 + 0.22 * Math.sin(time * pulseSpeed + idx)) * (isHovered ? 1.3 : 1.0);
      h.pulseRing.scale.set(pulseScale, pulseScale, 1);

      // Halo ring rotation & fade
      h.haloRing.rotation.z += 0.015;
      const ringMat = h.pulseRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = isSelected ? 0.85 : (isHovered ? 0.7 : 0.4);

      // Scale core on hover/selected
      const targetCoreScale = isSelected ? 1.35 : (isHovered ? 1.25 : 1.0);
      h.coreMesh.scale.lerp(new THREE.Vector3(targetCoreScale, targetCoreScale, targetCoreScale), 0.15);
    });

    // 4. Animate wellness dust particles drifting upwards
    if (this.particlesGroup) {
      const posAttr = this.particlesGroup.geometry.attributes['position'] as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.0035;
        if (positions[i + 1] > 2.2) {
          positions[i + 1] = -0.9;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  };

  private disposeThree(): void {
    if (!this.scene) return;

    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.renderer?.dispose();
  }
}
