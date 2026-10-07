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
import { MassageLayerType } from '../../../core/models/wellness.model';

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
  layer: MassageLayerType;
  actionText: string;
}

@Component({
  selector: 'app-body-canvas-3d',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="canvas-3d-wrapper" #wrapper>
      <!-- Top 3D Control Bar -->
      <div class="controls-overlay">
        <!-- Layer Selector Pills (Muscular, Linfático, Relajación) -->
        <div class="layers-pill" role="tablist" aria-label="Capas anatómicas de masaje">
          <button
            type="button"
            class="layer-btn"
            [class.active]="currentLayer() === 'muscular'"
            (click)="setLayer('muscular')"
            title="Mapa Muscular: Fibras y Puntos Gatillo"
          >
            <app-icon name="zap" [size]="13" />
            <span class="btn-text">Muscular</span>
          </button>
          <button
            type="button"
            class="layer-btn"
            [class.active]="currentLayer() === 'linfatico'"
            (click)="setLayer('linfatico')"
            title="Mapa Linfático: Nodos y Canales de Drenaje"
          >
            <app-icon name="activity" [size]="13" />
            <span class="btn-text">Linfático</span>
          </button>
          <button
            type="button"
            class="layer-btn"
            [class.active]="currentLayer() === 'relajacion'"
            (click)="setLayer('relajacion')"
            title="Mapa de Relajación: Puntos de Digitopresión Spa"
          >
            <app-icon name="sparkles" [size]="13" />
            <span class="btn-text">Puntos Spa</span>
          </button>
        </div>

        <!-- Camera & View Actions -->
        <div class="actions-pill">
          <button
            type="button"
            class="action-btn"
            [class.active]="currentAngleView() === 'back'"
            (click)="rotateTo('back')"
            title="Vista de espalda"
          >
            Espalda
          </button>
          <button
            type="button"
            class="action-btn"
            [class.active]="currentAngleView() === 'front'"
            (click)="rotateTo('front')"
            title="Vista de frente"
          >
            Frente
          </button>
          <button
            type="button"
            class="action-btn icon-only"
            [class.active]="isAutoRotating()"
            (click)="toggleAutoRotate()"
            title="Rotación continua 360°"
          >
            <app-icon name="compass" [size]="13" />
          </button>
          <button
            type="button"
            class="action-btn icon-only"
            (click)="resetView()"
            title="Restablecer orientación"
          >
            <app-icon name="activity" [size]="13" />
          </button>
        </div>
      </div>

      <!-- Canvas Element -->
      <canvas #canvas3d class="three-canvas"></canvas>

      <!-- Active Layer Legend Badge -->
      <div class="layer-indicator-badge" [class.layer-muscular]="currentLayer() === 'muscular'" [class.layer-linfatico]="currentLayer() === 'linfatico'" [class.layer-relajacion]="currentLayer() === 'relajacion'">
        <span class="layer-dot"></span>
        @if (currentLayer() === 'muscular') {
          <span>Fibras Musculares & Puntos Gatillo</span>
        } @else if (currentLayer() === 'linfatico') {
          <span>Canales Linfáticos & Nodos de Drenaje</span>
        } @else {
          <span>Puntos de Digitopresión & Calma Nerviosa</span>
        }
      </div>

      <!-- Hover / Selected Floating Tooltip -->
      @if (hoveredZone()) {
        <div 
          class="zone-tooltip" 
          [style.left.px]="tooltipPos().x" 
          [style.top.px]="tooltipPos().y"
        >
          <span class="tooltip-num">{{ hoveredZone()?.number }}</span>
          <span class="tooltip-name">{{ hoveredZone()?.name }}</span>
          <span class="tooltip-action">{{ hoveredZone()?.actionText }}</span>
        </div>
      }

      <!-- Interactive User Guide Hint -->
      <div class="interaction-guide" [class.fade-out]="hasInteracted()">
        <span class="guide-hand">👆</span>
        <span>Arrastra para rotar 3D · Toca los puntos numerados</span>
      </div>
    </div>
  `,
  styleUrl: './body-canvas-3d.component.scss'
})
export class BodyCanvas3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapper', { static: true }) wrapperRef!: ElementRef<HTMLDivElement>;

  @Input() activeZoneId: string = 'cuello';
  @Input() set activeLayer(val: MassageLayerType) {
    if (val && val !== this.currentLayer()) {
      this.currentLayer.set(val);
      this.updateLayerVisuals(val);
    }
  }

  @Output() zoneSelected = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'front' | 'back'>();
  @Output() layerChange = new EventEmitter<MassageLayerType>();

  private readonly themeService = inject(ThemeService);

  readonly currentLayer = signal<MassageLayerType>('muscular');
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
  private muscularGroup!: THREE.Group;
  private lymphaticGroup!: THREE.Group;
  private relaxationGroup!: THREE.Group;
  private particlesGroup!: THREE.Points;
  private lymphParticles!: THREE.Points;
  private lymphPositions!: Float32Array;

  // Dynamic Lights
  private activeZoneLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;

  // Materials to track for theme & layer updates
  private bodyMaterial!: THREE.MeshPhysicalMaterial;
  private spineMaterial!: THREE.MeshStandardMaterial;
  private muscleMaterial!: THREE.MeshStandardMaterial;
  private lymphVesselMaterial!: THREE.MeshStandardMaterial;
  private lymphNodeMaterial!: THREE.MeshStandardMaterial;
  private relaxationWaveMaterial!: THREE.MeshBasicMaterial;

  // Interaction & Rotation state
  private targetRotationY: number = Math.PI; // default facing back
  private targetRotationX: number = 0;
  private isDragging: boolean = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private lastInteractionTime: number = Date.now();

  // Hotspots definitions across anatomical zones and layers
  private readonly hotspotsData: HotspotConfig[] = [
    {
      id: 'cuello',
      name: 'Cuello & Cervicales',
      number: '1',
      nodes: [
        { pos: new THREE.Vector3(0, 1.72, -0.16), side: 'back' },
        { pos: new THREE.Vector3(0, 1.72, 0.16), side: 'front' }
      ],
      preferredView: 'back',
      layer: 'muscular',
      actionText: 'Descompresión suboccipital'
    },
    {
      id: 'hombros',
      name: 'Hombros & Trapecios',
      number: '2',
      nodes: [
        { pos: new THREE.Vector3(-0.46, 1.50, 0), side: 'both' },
        { pos: new THREE.Vector3(0.46, 1.50, 0), side: 'both' }
      ],
      preferredView: 'back',
      layer: 'muscular',
      actionText: 'Liberación de nudos'
    },
    {
      id: 'espalda-alta',
      name: 'Espalda Alta & Dorsales',
      number: '3',
      nodes: [
        { pos: new THREE.Vector3(0, 1.34, -0.22), side: 'back' }
      ],
      preferredView: 'back',
      layer: 'muscular',
      actionText: 'Tracción escapular'
    },
    {
      id: 'espalda-baja',
      name: 'Espalda Baja & Lumbar',
      number: '4',
      nodes: [
        { pos: new THREE.Vector3(0, 0.88, -0.21), side: 'back' }
      ],
      preferredView: 'back',
      layer: 'muscular',
      actionText: 'Descompresión L1-L5'
    },
    {
      id: 'brazos-manos',
      name: 'Brazos, Antebrazos & Manos',
      number: '5',
      nodes: [
        { pos: new THREE.Vector3(-0.58, 0.68, 0.08), side: 'front' },
        { pos: new THREE.Vector3(0.58, 0.68, 0.08), side: 'front' }
      ],
      preferredView: 'front',
      layer: 'muscular',
      actionText: 'Drenaje antebrazo'
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
      preferredView: 'back',
      layer: 'muscular',
      actionText: 'Descarga circulatoria'
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

  setLayer(layer: MassageLayerType): void {
    this.currentLayer.set(layer);
    this.layerChange.emit(layer);
    this.updateLayerVisuals(layer);
  }

  private updateLayerVisuals(layer: MassageLayerType): void {
    if (!this.muscularGroup || !this.lymphaticGroup || !this.relaxationGroup) return;

    // Smooth visibility transitions
    this.muscularGroup.visible = layer === 'muscular';
    this.lymphaticGroup.visible = layer === 'linfatico';
    this.relaxationGroup.visible = layer === 'relajacion';

    // Tone dynamic lights according to layer
    if (this.activeZoneLight) {
      if (layer === 'muscular') {
        this.activeZoneLight.color.setHex(0xe5a93c);
        this.fillLight.color.setHex(0xafc4a8);
      } else if (layer === 'linfatico') {
        this.activeZoneLight.color.setHex(0x38b2ac);
        this.fillLight.color.setHex(0x48bfe3);
      } else {
        this.activeZoneLight.color.setHex(0x93c5fd);
        this.fillLight.color.setHex(0xd9e4d5);
      }
    }

    // Update hotspots color scheme according to active layer
    this.updateHotspotColors(layer);
  }

  private updateHotspotColors(layer: MassageLayerType): void {
    let coreColor = 0x1e5c46;
    let emissiveColor = 0x2e6f58;

    if (layer === 'muscular') {
      coreColor = 0xd97706;
      emissiveColor = 0xb45309;
    } else if (layer === 'linfatico') {
      coreColor = 0x0d9488;
      emissiveColor = 0x14b8a6;
    } else {
      coreColor = 0x2563eb;
      emissiveColor = 0x3b82f6;
    }

    this.hotspotMeshes.forEach(h => {
      const isSelected = h.config.id === this.activeZoneId;
      const mat = h.coreMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(isSelected ? coreColor : 0x1e5c46);
      mat.emissive.setHex(isSelected ? emissiveColor : 0x0f2e23);
      mat.emissiveIntensity = isSelected ? 2.0 : 0.8;
    });
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const wrapper = this.wrapperRef.nativeElement;
    const width = wrapper.clientWidth || 320;
    const height = wrapper.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
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

    // 5. Build 3D Mannequin Body
    this.buildBodyModel();

    // 6. Build 3D Anatomical Layers (Muscular, Linfático, Relajación)
    this.buildMuscularLayer();
    this.buildLymphaticLayer();
    this.buildRelaxationLayer();

    // 7. Build Interactive Hotspots
    this.buildHotspots();

    // 8. Ambient Spa Particles
    this.buildParticles();

    // 9. Ground Soft Aura Disc
    this.buildGroundAura();

    // 10. Initial Layer State & Theme
    this.bodyGroup.rotation.y = this.targetRotationY;
    this.updateLayerVisuals(this.currentLayer());
    this.updateThemeMaterials(this.themeService.isDark());

    // 11. Listeners and Loop
    this.setupEventListeners();
    this.setupObservers();
    this.animate();
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xf7f2e8, 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfffaee, 1.8);
    this.keyLight.position.set(2.8, 3.5, 3.2);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xafc4a8, 1.3);
    this.fillLight.position.set(-2.6, 2.0, -2.6);
    this.scene.add(this.fillLight);

    this.activeZoneLight = new THREE.PointLight(0xe5a93c, 2.8, 2.6);
    this.activeZoneLight.position.set(0, 1.5, -0.5);
    this.scene.add(this.activeZoneLight);
  }

  private buildBodyModel(): void {
    this.bodyGroup = new THREE.Group();
    this.bodyMeshGroup = new THREE.Group();

    const isDark = this.themeService.isDark();

    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x143329 : 0xf2ece1,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
      reflectivity: 0.5
    });

    // Head
    const headGeo = new THREE.SphereGeometry(0.27, 32, 24);
    headGeo.scale(0.88, 1.15, 0.94);
    const headMesh = new THREE.Mesh(headGeo, this.bodyMaterial);
    headMesh.position.set(0, 1.95, 0);
    this.bodyMeshGroup.add(headMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.28, 24);
    const neckMesh = new THREE.Mesh(neckGeo, this.bodyMaterial);
    neckMesh.position.set(0, 1.68, 0);
    this.bodyMeshGroup.add(neckMesh);

    // Chest & Scapula
    const chestGeo = new THREE.CylinderGeometry(0.40, 0.33, 0.44, 32);
    chestGeo.scale(1.18, 1.0, 0.72);
    const chestMesh = new THREE.Mesh(chestGeo, this.bodyMaterial);
    chestMesh.position.set(0, 1.35, 0);
    this.bodyMeshGroup.add(chestMesh);

    // Shoulder arch
    const shoulderArchGeo = new THREE.SphereGeometry(0.36, 24, 16);
    shoulderArchGeo.scale(1.22, 0.45, 0.7);
    const shoulderArchMesh = new THREE.Mesh(shoulderArchGeo, this.bodyMaterial);
    shoulderArchMesh.position.set(0, 1.48, 0);
    this.bodyMeshGroup.add(shoulderArchMesh);

    // Waist / Core
    const waistGeo = new THREE.CylinderGeometry(0.33, 0.31, 0.34, 32);
    waistGeo.scale(1.02, 1.0, 0.68);
    const waistMesh = new THREE.Mesh(waistGeo, this.bodyMaterial);
    waistMesh.position.set(0, 0.98, 0);
    this.bodyMeshGroup.add(waistMesh);

    // Hips / Pelvis
    const hipsGeo = new THREE.CylinderGeometry(0.31, 0.36, 0.36, 32);
    hipsGeo.scale(1.12, 1.0, 0.74);
    const hipsMesh = new THREE.Mesh(hipsGeo, this.bodyMaterial);
    hipsMesh.position.set(0, 0.65, 0);
    this.bodyMeshGroup.add(hipsMesh);

    // Deltoids
    const shoulderGeo = new THREE.SphereGeometry(0.135, 20, 20);
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    leftShoulder.position.set(-0.46, 1.48, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, this.bodyMaterial);
    rightShoulder.position.set(0.46, 1.48, 0);
    this.bodyMeshGroup.add(leftShoulder, rightShoulder);

    // Upper Arms
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

    // Thighs
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

    // Physiological Spine Discs
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
      const curve = Math.sin(t * Math.PI) * 0.04;
      const z = -0.16 - curve;
      disc.position.set(0, y, z);
      this.bodyMeshGroup.add(disc);
    }

    this.bodyGroup.add(this.bodyMeshGroup);
    this.scene.add(this.bodyGroup);
  }

  /* -------------------------------------------------------------
     CAPA 1: MUSCULAR (Fibras miofasciales, trapecios y dorsales)
     ------------------------------------------------------------- */
  private buildMuscularLayer(): void {
    this.muscularGroup = new THREE.Group();

    this.muscleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xb45309,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    // Helper to build curved muscle fiber band
    const createFiberBand = (points: THREE.Vector3[], radius = 0.024) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 18, radius, 8, false);
      return new THREE.Mesh(tubeGeo, this.muscleMaterial);
    };

    // Trapezius Bands (Descending fibers from neck to scapula)
    const leftTrap = createFiberBand([
      new THREE.Vector3(-0.06, 1.75, -0.12),
      new THREE.Vector3(-0.25, 1.60, -0.10),
      new THREE.Vector3(-0.42, 1.48, -0.06)
    ], 0.032);

    const rightTrap = createFiberBand([
      new THREE.Vector3(0.06, 1.75, -0.12),
      new THREE.Vector3(0.25, 1.60, -0.10),
      new THREE.Vector3(0.42, 1.48, -0.06)
    ], 0.032);
    this.muscularGroup.add(leftTrap, rightTrap);

    // Scapular & Rhomboid Fibers (Across upper back)
    const leftRhomboid = createFiberBand([
      new THREE.Vector3(-0.05, 1.44, -0.22),
      new THREE.Vector3(-0.22, 1.40, -0.18),
      new THREE.Vector3(-0.35, 1.34, -0.14)
    ], 0.026);

    const rightRhomboid = createFiberBand([
      new THREE.Vector3(0.05, 1.44, -0.22),
      new THREE.Vector3(0.22, 1.40, -0.18),
      new THREE.Vector3(0.35, 1.34, -0.14)
    ], 0.026);
    this.muscularGroup.add(leftRhomboid, rightRhomboid);

    // Paravertebral Spinal Muscle Columns (Longissimus dorsi)
    const leftSpineMuscle = createFiberBand([
      new THREE.Vector3(-0.08, 1.55, -0.20),
      new THREE.Vector3(-0.08, 1.25, -0.22),
      new THREE.Vector3(-0.09, 0.95, -0.21),
      new THREE.Vector3(-0.10, 0.70, -0.20)
    ], 0.03);

    const rightSpineMuscle = createFiberBand([
      new THREE.Vector3(0.08, 1.55, -0.20),
      new THREE.Vector3(0.08, 1.25, -0.22),
      new THREE.Vector3(0.09, 0.95, -0.21),
      new THREE.Vector3(0.10, 0.70, -0.20)
    ], 0.03);
    this.muscularGroup.add(leftSpineMuscle, rightSpineMuscle);

    // Lumbar Quadratus Fans
    const leftLumbar = createFiberBand([
      new THREE.Vector3(-0.12, 0.95, -0.19),
      new THREE.Vector3(-0.24, 0.82, -0.17),
      new THREE.Vector3(-0.22, 0.68, -0.18)
    ], 0.028);

    const rightLumbar = createFiberBand([
      new THREE.Vector3(0.12, 0.95, -0.19),
      new THREE.Vector3(0.24, 0.82, -0.17),
      new THREE.Vector3(0.22, 0.68, -0.18)
    ], 0.028);
    this.muscularGroup.add(leftLumbar, rightLumbar);

    // Calf Gastrocnemius Bands
    const leftCalfMuscle = createFiberBand([
      new THREE.Vector3(-0.18, -0.22, -0.13),
      new THREE.Vector3(-0.18, -0.45, -0.14),
      new THREE.Vector3(-0.18, -0.68, -0.11)
    ], 0.035);

    const rightCalfMuscle = createFiberBand([
      new THREE.Vector3(0.18, -0.22, -0.13),
      new THREE.Vector3(0.18, -0.45, -0.14),
      new THREE.Vector3(0.18, -0.68, -0.11)
    ], 0.035);
    this.muscularGroup.add(leftCalfMuscle, rightCalfMuscle);

    this.bodyGroup.add(this.muscularGroup);
  }

  /* -------------------------------------------------------------
     CAPA 2: LINFÁTICA (Canales de flujo y ganglios linfáticos)
     ------------------------------------------------------------- */
  private buildLymphaticLayer(): void {
    this.lymphaticGroup = new THREE.Group();

    this.lymphVesselMaterial = new THREE.MeshStandardMaterial({
      color: 0x38b2ac,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });

    this.lymphNodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x48bfe3,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.6,
      roughness: 0.15,
      metalness: 0.3
    });

    const createVessel = (points: THREE.Vector3[], radius = 0.016) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 22, radius, 8, false);
      return new THREE.Mesh(tubeGeo, this.lymphVesselMaterial);
    };

    const createNodeCluster = (pos: THREE.Vector3, scale = 0.055) => {
      const nodeGeo = new THREE.SphereGeometry(scale, 16, 16);
      const node = new THREE.Mesh(nodeGeo, this.lymphNodeMaterial);
      node.position.copy(pos);
      return node;
    };

    // 1. Thoracic Main Duct (Columna de drenaje central)
    const thoracicDuct = createVessel([
      new THREE.Vector3(0, 0.72, 0.02),
      new THREE.Vector3(0.04, 1.05, 0.03),
      new THREE.Vector3(0.02, 1.38, 0.04),
      new THREE.Vector3(-0.06, 1.65, 0.06)
    ], 0.02);
    this.lymphaticGroup.add(thoracicDuct);

    // 2. Cervical Lymph Chains (Cuello a Clavículas - Terminus)
    const leftCervical = createVessel([
      new THREE.Vector3(-0.08, 1.85, 0.08),
      new THREE.Vector3(-0.12, 1.72, 0.10),
      new THREE.Vector3(-0.18, 1.58, 0.08)
    ]);
    const rightCervical = createVessel([
      new THREE.Vector3(0.08, 1.85, 0.08),
      new THREE.Vector3(0.12, 1.72, 0.10),
      new THREE.Vector3(0.18, 1.58, 0.08)
    ]);
    this.lymphaticGroup.add(leftCervical, rightCervical);

    // 3. Axillary Channels (Brazos a Axilas)
    const leftArmVessel = createVessel([
      new THREE.Vector3(-0.58, 0.55, 0.06),
      new THREE.Vector3(-0.55, 0.85, 0.04),
      new THREE.Vector3(-0.48, 1.20, 0.03),
      new THREE.Vector3(-0.35, 1.40, 0.02)
    ]);
    const rightArmVessel = createVessel([
      new THREE.Vector3(0.58, 0.55, 0.06),
      new THREE.Vector3(0.55, 0.85, 0.04),
      new THREE.Vector3(0.48, 1.20, 0.03),
      new THREE.Vector3(0.35, 1.40, 0.02)
    ]);
    this.lymphaticGroup.add(leftArmVessel, rightArmVessel);

    // 4. Inguinal to Legs (Canales ilíacos a extremidades)
    const leftLegVessel = createVessel([
      new THREE.Vector3(-0.18, -0.75, 0.06),
      new THREE.Vector3(-0.17, -0.42, 0.07),
      new THREE.Vector3(-0.17, -0.10, 0.06),
      new THREE.Vector3(-0.16, 0.28, 0.05),
      new THREE.Vector3(-0.12, 0.60, 0.03)
    ]);
    const rightLegVessel = createVessel([
      new THREE.Vector3(0.18, -0.75, 0.06),
      new THREE.Vector3(0.17, -0.42, 0.07),
      new THREE.Vector3(0.17, -0.10, 0.06),
      new THREE.Vector3(0.16, 0.28, 0.05),
      new THREE.Vector3(0.12, 0.60, 0.03)
    ]);
    this.lymphaticGroup.add(leftLegVessel, rightLegVessel);

    // Lymph Nodes (Ganglios clave)
    const nodes = [
      new THREE.Vector3(-0.16, 1.62, 0.08),  // Cervical Terminus Izq
      new THREE.Vector3(0.16, 1.62, 0.08),   // Cervical Terminus Der
      new THREE.Vector3(-0.36, 1.42, 0.02),  // Axilar Izq
      new THREE.Vector3(0.36, 1.42, 0.02),   // Axilar Der
      new THREE.Vector3(0.01, 0.85, 0.04),   // Cisterna de Pecquet
      new THREE.Vector3(-0.15, 0.58, 0.06),  // Inguinal Izq
      new THREE.Vector3(0.15, 0.58, 0.06),   // Inguinal Der
      new THREE.Vector3(-0.18, -0.12, -0.06),// Poplíteo Izq
      new THREE.Vector3(0.18, -0.12, -0.06)  // Poplíteo Der
    ];

    nodes.forEach(pos => {
      this.lymphaticGroup.add(createNodeCluster(pos));
    });

    // Flowing Lymph Particles (Moving upward through lymphatic ducts)
    const pCount = 95;
    const pGeo = new THREE.BufferGeometry();
    this.lymphPositions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      this.lymphPositions[idx] = (Math.random() - 0.5) * 0.45;
      this.lymphPositions[idx + 1] = -0.75 + Math.random() * 2.5;
      this.lymphPositions[idx + 2] = (Math.random() - 0.5) * 0.2;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(this.lymphPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x48bfe3,
      size: 0.035,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.lymphParticles = new THREE.Points(pGeo, pMat);
    this.lymphaticGroup.add(this.lymphParticles);

    this.bodyGroup.add(this.lymphaticGroup);
  }

  /* -------------------------------------------------------------
     CAPA 3: RELAJACIÓN (Digitopresión Zen & Ondas de Calma Spa)
     ------------------------------------------------------------- */
  private buildRelaxationLayer(): void {
    this.relaxationGroup = new THREE.Group();

    this.relaxationWaveMaterial = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    // Relaxation Points with Expanding Calming Waves
    const relaxationPoints = [
      new THREE.Vector3(0, 1.76, -0.18),    // Feng Chi (Occipital)
      new THREE.Vector3(-0.42, 1.50, -0.02),// Jian Jing Izq
      new THREE.Vector3(0.42, 1.50, -0.02), // Jian Jing Der
      new THREE.Vector3(0, 1.35, -0.22),    // Corazón dorsal
      new THREE.Vector3(0, 0.88, -0.21),    // Mingmen lumbar
      new THREE.Vector3(-0.18, -0.80, 0.04),// Yongquan Izq
      new THREE.Vector3(0.18, -0.80, 0.04)  // Yongquan Der
    ];

    relaxationPoints.forEach(pos => {
      const waveGeo = new THREE.RingGeometry(0.06, 0.16, 24);
      const waveMesh = new THREE.Mesh(waveGeo, this.relaxationWaveMaterial.clone());
      waveMesh.position.copy(pos);
      waveMesh.userData = { initialScale: 1.0, isWave: true };
      this.relaxationGroup.add(waveMesh);

      // Lotus-like glowing center sphere
      const dotGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const dotMat = new THREE.MeshStandardMaterial({
        color: 0xbfdbfe,
        emissive: 0x60a5fa,
        emissiveIntensity: 1.5,
        roughness: 0.1
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      this.relaxationGroup.add(dotMesh);
    });

    this.bodyGroup.add(this.relaxationGroup);
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

        // Core Sphere
        const coreGeo = new THREE.SphereGeometry(0.055, 20, 20);
        const isSelected = config.id === this.activeZoneId;
        const coreMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xd97706 : 0x1e5c46,
          emissive: isSelected ? 0xb45309 : 0x1e5c46,
          emissiveIntensity: isSelected ? 2.0 : 0.8,
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

        // 3D Number Badge Sprite
        const badgeSprite = this.createNumberBadgeSprite(config.number);
        badgeSprite.position.set(0, 0.11, 0.05);
        nodeGroup.add(badgeSprite);

        this.hotspotsGroup.add(nodeGroup);

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
      });
    });

    this.bodyGroup.add(this.hotspotsGroup);
  }

  private createNumberBadgeSprite(numberStr: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#AFC4A8';
      ctx.fill();

      ctx.lineWidth = 6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.font = 'bold 52px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#123C32';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numberStr, 64, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.16, 0.16, 1);
    return sprite;
  }

  private buildParticles(): void {
    const particleCount = 75;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3.5;
      positions[i + 1] = (Math.random() - 0.5) * 4.0 + 0.6;
      positions[i + 2] = (Math.random() - 0.5) * 2.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xafc4a8,
      size: 0.045,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.particlesGroup = new THREE.Points(geo, mat);
    this.scene.add(this.particlesGroup);
  }

  private buildGroundAura(): void {
    const auraGeo = new THREE.CircleGeometry(1.6, 48);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xafc4a8,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.rotation.x = -Math.PI / 2;
    auraMesh.position.y = -1.0;
    this.scene.add(auraMesh);
  }

  // Active Hotspot visuals synchronization
  updateActiveHotspotVisuals(zoneId: string): void {
    this.activeZoneId = zoneId;
    this.updateHotspotColors(this.currentLayer());

    // Locate active node and orient light
    const targetConfig = this.hotspotsData.find(h => h.id === zoneId);
    if (targetConfig && targetConfig.nodes.length > 0) {
      const pos = targetConfig.nodes[0].pos;
      if (this.activeZoneLight) {
        this.activeZoneLight.position.set(pos.x, pos.y, pos.z - 0.4);
      }
    }
  }

  // Camera Orientation controls
  rotateTo(side: 'back' | 'front'): void {
    this.currentAngleView.set(side);
    this.isAutoRotating.set(false);
    this.hasInteracted.set(true);

    if (side === 'back') {
      this.targetRotationY = Math.PI;
    } else {
      this.targetRotationY = 0;
    }
    this.targetRotationX = 0;
    this.viewModeChange.emit(side);
  }

  toggleAutoRotate(): void {
    this.isAutoRotating.update(v => !v);
    this.hasInteracted.set(true);
  }

  resetView(): void {
    this.rotateTo('back');
  }

  // Setup Observers & Listeners
  private setupObservers(): void {
    const wrapper = this.wrapperRef.nativeElement;

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.isVisible = entries[0]?.isIntersecting ?? true;
      }, { threshold: 0.1 });
      this.intersectionObserver.observe(wrapper);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          this.handleResize(width, height);
        }
      });
      this.resizeObserver.observe(wrapper);
    }
  }

  private handleResize(width: number, height: number): void {
    if (!this.renderer || !this.camera || width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
  }

  private removeEventListeners(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerleave', this.onPointerLeave);
    }
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.previousPointerPosition = { x: e.clientX, y: e.clientY };
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.hasInteracted.set(true);
    this.lastInteractionTime = Date.now();
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging) {
      const deltaX = e.clientX - this.previousPointerPosition.x;
      const deltaY = e.clientY - this.previousPointerPosition.y;

      this.targetRotationY += deltaX * 0.009;
      this.targetRotationX += deltaY * 0.005;
      this.targetRotationX = Math.max(-0.25, Math.min(0.25, this.targetRotationX));

      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.isAutoRotating.set(false);
      this.lastInteractionTime = Date.now();
    } else {
      this.checkRaycastHover(e);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;

    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist < 6) {
      this.handleHotspotClick();
    }
  };

  private onPointerLeave = (): void => {
    this.hoveredZone.set(null);
  };

  private checkRaycastHover(e: PointerEvent): void {
    if (!this.camera || !this.hotspotMeshes.length) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = this.hotspotMeshes.map(h => h.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const config = hit.userData['config'] as HotspotConfig;
      this.hoveredZone.set(config);

      const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
      this.tooltipPos.set({
        x: Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left)),
        y: Math.max(20, e.clientY - rect.top - 18)
      });
    } else {
      this.hoveredZone.set(null);
    }
  }

  private handleHotspotClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = this.hotspotMeshes.map(h => h.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const zoneId = hit.userData['zoneId'] as string;
      if (zoneId) {
        this.zoneSelected.emit(zoneId);
        this.updateActiveHotspotVisuals(zoneId);
      }
    }
  }

  private updateThemeMaterials(isDark: boolean): void {
    if (!this.bodyMaterial) return;

    if (isDark) {
      this.bodyMaterial.color.setHex(0x143329);
      if (this.ambientLight) this.ambientLight.color.setHex(0x1a3d33);
    } else {
      this.bodyMaterial.color.setHex(0xf2ece1);
      if (this.ambientLight) this.ambientLight.color.setHex(0xf7f2e8);
    }
  }

  // Animation Loop
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    if (!this.isVisible) return;

    const time = performance.now() * 0.001;

    // Smooth inertia interpolation for rotation
    if (this.isAutoRotating()) {
      this.targetRotationY += 0.008;
    }

    this.bodyGroup.rotation.y += (this.targetRotationY - this.bodyGroup.rotation.y) * 0.08;
    this.bodyGroup.rotation.x += (this.targetRotationX - this.bodyGroup.rotation.x) * 0.08;

    // Gentle vertical breathing float
    this.bodyGroup.position.y = Math.sin(time * 1.5) * 0.018;

    // Hotspot rings subtle pulsation
    this.hotspotMeshes.forEach((h, index) => {
      const pulseScale = 1.0 + Math.sin(time * 3 + index) * 0.18;
      h.pulseRing.scale.set(pulseScale, pulseScale, pulseScale);
      h.pulseRing.lookAt(this.camera.position);
      h.haloRing.lookAt(this.camera.position);
    });

    // Animate Lymphatic Fluid Particles
    if (this.currentLayer() === 'linfatico' && this.lymphParticles && this.lymphPositions) {
      const count = this.lymphPositions.length / 3;
      for (let i = 0; i < count; i++) {
        const yIdx = i * 3 + 1;
        this.lymphPositions[yIdx] += 0.008; // Flow upward to heart/lymph nodes
        if (this.lymphPositions[yIdx] > 1.85) {
          this.lymphPositions[yIdx] = -0.75;
        }
      }
      this.lymphParticles.geometry.attributes['position'].needsUpdate = true;
    }

    // Animate Relaxation Waves
    if (this.currentLayer() === 'relajacion' && this.relaxationGroup) {
      this.relaxationGroup.children.forEach((child, i) => {
        if (child.userData['isWave']) {
          const waveScale = 1.0 + ((time * 0.8 + i * 0.3) % 1.5);
          child.scale.set(waveScale, waveScale, waveScale);
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.45 - (waveScale - 1.0) * 0.3);
          child.lookAt(this.camera.position);
        }
      });
    }

    // Floating ambient wellness dust
    if (this.particlesGroup) {
      this.particlesGroup.rotation.y = time * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private disposeThree(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
