import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

@Component({
  selector: 'app-hero-wave',
  templateUrl: './hero-wave.html',
  styleUrl: './hero-wave.scss'
})
export class HeroWave implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private water?: Water;
  private pmremGenerator?: THREE.PMREMGenerator;
  private frameId = 0;
  private resizeObserver?: ResizeObserver;
  private clock = new THREE.Clock();

  ngAfterViewInit() {
    this.init();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.water?.geometry.dispose();
    (this.water?.material as THREE.Material | undefined)?.dispose();
    this.pmremGenerator?.dispose();
    this.renderer?.dispose();
  }

  private init() {
    const host = this.canvasRef.nativeElement.parentElement!;
    const width = host.clientWidth;
    const height = host.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 20000);
    camera.position.set(0, 12, 60);
    this.camera = camera;

    const sun = new THREE.Vector3();

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    this.water = water;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator = pmremGenerator;

    const phi = THREE.MathUtils.degToRad(90 - 12);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);
    (water.material.uniforms['sunDirection'].value as THREE.Vector3).copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky as unknown as THREE.Scene).texture;

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);

    this.animate();
  }

  private onResize() {
    if (!this.renderer || !this.camera) return;
    const host = this.canvasRef.nativeElement.parentElement!;
    const width = host.clientWidth;
    const height = host.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    if (this.water) {
      (this.water.material.uniforms['time'].value as number) += delta;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };
}
