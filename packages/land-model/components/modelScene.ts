import * as BABYLON from 'babylonjs';
import { GLTF2Export } from 'babylonjs-serializers';
import type { ParcelCoordinateHelper } from './parcelCoordinateHelper';
import * as colorConvert from 'color-convert';
import type { KEYWORD as ColorKeywords } from 'color-convert/conversions';
import groundColorImg from '../textures/Ground049A_1K_mini/Color.jpg';
import groundNormalImg from '../textures/Ground049A_1K_mini/NormalGL.jpg';

type ParcelDimensions = {
	width: number;
	height: number;
	depth: number;
	boundaryLengths: number[];
};

export class BabylonScene {
	public _engine: BABYLON.Engine;
	public _scene: BABYLON.Scene;
	private _camera: BABYLON.ArcRotateCamera;
	private _light_top: BABYLON.HemisphericLight;
	private _light_bottom: BABYLON.HemisphericLight;
	private _isDragging = false;
	dirtMesh!: BABYLON.Mesh;
	groundPlane!: BABYLON.Mesh;
	modelUrl!: string;
	markers: Marker[] = [];
	backgroundColor3: BABYLON.Color3 | null = null;

	constructor(
		public canvas: HTMLCanvasElement,
		public parcelDimensions: ParcelDimensions,
		public backgroundColor?: string
	) {
		this._setBackgroundColor();
		this._initializeEngine();
		this._initializeScene();
		this._initializeCamera();
		this._initializeLight();
		this._initializeRenderLoop();
		this._initializeWindowResize();
		this._preventDefaultBehaviors();
		this._stopCameraRotation();
	}

	private _initializeEngine(): void {
		this._engine = new BABYLON.Engine(this.canvas, true);
	}

	private _initializeScene(): void {
		this._scene = new BABYLON.Scene(this._engine);
		//   this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
		if (this.backgroundColor3) this._scene.clearColor = this.backgroundColor3.toColor4();
		this._scene.ambientColor = new BABYLON.Color3(1, 1, 1);
	}

	private _initializeCamera(): void {
		this._camera = new BABYLON.ArcRotateCamera(
			'Camera',
			Math.PI * 1.5,
			Math.PI / 2.5,
			100,
			BABYLON.Vector3.Zero(),
			this._scene
		);

		// Set camera radius to fit parcel
		const halfWidth = this.parcelDimensions.width / 2;
		const halfHeight = this.parcelDimensions.height / 2;
		const halfDiagonal = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
		const fov = this._engine.getAspectRatio(this._camera) * this._camera.fov;
		this._camera.lowerRadiusLimit = halfDiagonal / Math.tan(fov / 2);

		// Limit camera movements
		this._camera.attachControl(this.canvas, true);
		this._camera.lowerBetaLimit = 0.1;
		this._camera.upperBetaLimit = Math.PI * 0.55;
		this._camera.upperRadiusLimit = 300;
		this._camera.panningSensibility = 0;
	}

	private _updateCameraRotation = (): void => {
		const deltaTime = this._scene.getEngine().getDeltaTime();
		this._camera.alpha += 0.0002 * deltaTime;
	};

	private _checkForPointerDown = (pointerInfo: BABYLON.PointerInfo): void => {
		console.log('pointerInfo: ', pointerInfo);
		if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
			this._scene.onBeforeRenderObservable.removeCallback(this._updateCameraRotation);
			this._scene.onPointerObservable.removeCallback(this._checkForPointerDown);
		}
	};

	private _stopCameraRotation(): void {
		// start camera rotation
		this._scene.onBeforeRenderObservable.add(this._updateCameraRotation);
		// only stop when pointer is down and moving (dragging motion)
		this._scene.onPointerObservable.add((pointerInfo) => {
			if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
				this._isDragging = true;
			} else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
				this._isDragging = false;
			} else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
				if (this._isDragging) {
					this._scene.onBeforeRenderObservable.removeCallback(this._updateCameraRotation);
				}
			}
		});
	}

	private _initializeLight(): void {
		this._light_top = new BABYLON.HemisphericLight(
			'light-top',
			new BABYLON.Vector3(0, 1, 0),
			this._scene
		);
		this._light_bottom = new BABYLON.HemisphericLight(
			'light-bottom',
			new BABYLON.Vector3(0, -1, 0),
			this._scene
		);
	}

	private _initializeRenderLoop(): void {
		this._engine.runRenderLoop(() => {
			this._scene.render();
		});
	}

	private _initializeWindowResize(): void {
		const resize = () => {
			this._engine.resize();
		};
		window.addEventListener('resize', resize);
		this._scene.onDisposeObservable.add(() => {
			window.removeEventListener('resize', resize);
		});
	}

	private _preventDefaultBehaviors(): void {
		// prevent scrolling from moving page
		this._scene.onPointerObservable.add((pointerInfo) => {
			switch (pointerInfo.type) {
				case BABYLON.PointerEventTypes.POINTERWHEEL:
					pointerInfo.event.preventDefault();
					break;
			}
		});
	}

	private _setBackgroundColor(): void {
		if (this.backgroundColor) {
			if (!/^#[0-9A-F]{6}$/i.test(this.backgroundColor)) {
				try {
					this.backgroundColor =
						'#' + colorConvert.keyword.hex(this.backgroundColor as ColorKeywords);
				} catch (error) {
					console.error('Error converting color to hex:', error);
					return;
				}
			}
			this.backgroundColor3 = BABYLON.Color3.FromHexString(this.backgroundColor);
		}
	}

	async createGroundPlane(terrainURL: string, satelliteUrl: string): Promise<void> {
		this.groundPlane = BABYLON.MeshBuilder.CreateGround(
			'groundPlane',
			{
				width: this.parcelDimensions.width,
				height: this.parcelDimensions.height,
				subdivisionsX: Math.round(this.parcelDimensions.width * 2),
				subdivisionsY: Math.round(this.parcelDimensions.height * 2),
				updatable: true
			},
			this._scene
		);

		// Flip the UVs vertically and apply displacement map
		const uvData = this.groundPlane.getVerticesData(BABYLON.VertexBuffer.UVKind);
		for (let i = 0; i < uvData.length; i += 2) {
			const u = uvData[i];
			const v = uvData[i + 1];
			uvData[i] = u;
			uvData[i + 1] = 1 - v;
		}
		this.groundPlane.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvData);

		// Create material - slight artifacts on transparent plane, but not visible w dark background
		const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this._scene);
		groundMaterial.diffuseTexture = new BABYLON.Texture(satelliteUrl, this._scene);
		groundMaterial.diffuseTexture.vScale = -1;
		groundMaterial.diffuseTexture.hasAlpha = true;
		groundMaterial.specularColor = BABYLON.Color3.Black();
		this.groundPlane.material = groundMaterial;

		// Reduce appearance of seams between ground plane and dirt mesh
		// this.groundPlane.position.y -= 0.03;
		groundMaterial.backFaceCulling = false;

		// Set camera target to ground plane
		// this._camera.setTarget(this.groundPlane);
		// this._camera.panningSensibility = 0;
		// this._camera.useFramingBehavior = true;
		// if (this._camera.framingBehavior) this._camera.framingBehavior.framingTime = 1;

		await new Promise((resolve) => {
			this.groundPlane.applyDisplacementMap(terrainURL, 0, this.parcelDimensions.depth, () => {
				resolve(true);
			});
		});
	}

	createDirtMesh(
		multiPolygon: number[][][][],
		terrainURL: string,
		edgeDepthRange: [number, number]
	): void {
		// remove depth below ground plane cut-off to keep dirt height consistent
		const totalModelHeight = this.parcelDimensions.depth - edgeDepthRange[0] + 5;
		multiPolygon.forEach((polygon, index) => {
			const [outerCoords, ...innerCoords] = polygon;
			const shape = outerCoords.map(
				(coord: number[]) =>
					new BABYLON.Vector3(
						coord[0] * this.parcelDimensions.width,
						0,
						coord[1] * this.parcelDimensions.height
					)
			);
			const holes = innerCoords.map((hole: number[][]) => {
				return hole.map(
					(coord: number[]) =>
						new BABYLON.Vector3(
							coord[0] * this.parcelDimensions.width,
							0,
							coord[1] * this.parcelDimensions.height
						)
				);
			});

			// Calculation for bottom texture UVs
			const [minX, maxX, minZ, maxZ] = shape.reduce(
				([minX, maxX, minZ, maxZ], coord) => {
					if (coord.x < minX) minX = coord.x;
					if (coord.x > maxX) maxX = coord.x;
					if (coord.z < minZ) minZ = coord.z;
					if (coord.z > maxZ) maxZ = coord.z;
					return [minX, maxX, minZ, maxZ];
				},
				[Infinity, -Infinity, Infinity, -Infinity]
			);
			const percentOfWidth = (maxX - minX) / this.parcelDimensions.width;
			const percentOfHeight = (maxZ - minZ) / this.parcelDimensions.height;

			// Calculation for side texture UVs
			const numTextureRepeats = this.parcelDimensions.boundaryLengths[index] / totalModelHeight;
			const textureScale = totalModelHeight * 0.02;
			// Texture UVs
			const faceUV = [];
			faceUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
			faceUV[1] = new BABYLON.Vector4(0, 0, numTextureRepeats * textureScale, textureScale);
			faceUV[2] = new BABYLON.Vector4(
				0,
				0,

				percentOfWidth * Math.min(this.parcelDimensions.width / this.parcelDimensions.height, 1),
				percentOfHeight * Math.min(this.parcelDimensions.height / this.parcelDimensions.width, 1)
			);

			this.dirtMesh = BABYLON.MeshBuilder.ExtrudePolygon('polygon', {
				shape: shape,
				holes: holes,
				depth: totalModelHeight,
				faceUV: faceUV,
				wrap: true,
				updatable: true,
				sideOrientation: BABYLON.Mesh.DOUBLESIDE
			});
			this.dirtMesh.position.y = this.parcelDimensions.depth;

			const dirtMeshMaterial = this.createDirtMaterial(terrainURL);
			this.dirtMesh.material = dirtMeshMaterial;
		});
	}

	createDirtMaterial(terrainURL: string): BABYLON.ShaderMaterial {
		const customVertexShader = `
			precision highp float;

			// Attributes
			attribute vec3 position;
			attribute vec2 uv;
			attribute vec3 normal; // Add normal attribute

			// Uniforms
			uniform mat4 worldViewProjection;

			// Varyings
			varying vec3 vPosition;
			varying vec2 vUV;
			varying vec3 vNormal; // Add normal varying

			void main(void) {
				vec4 outPosition = worldViewProjection * vec4(position, 1.0);
				gl_Position = outPosition;
				vPosition = position;
				vUV = uv;
				vNormal = normal; // Pass the normal to the fragment shader
			}
		`;

		const customFragmentShader = `
			precision highp float;

			// Varyings
			varying vec3 vPosition;
			varying vec2 vUV;
			varying vec3 vNormal; // Add normal varying

			// Uniforms
			uniform sampler2D heightMapTexture;
			uniform sampler2D diffuseTexture;
			uniform sampler2D bumpTexture;
			uniform float minHeight;
			uniform float maxHeight;
			uniform vec2 groundPlaneSize;
			uniform vec3 lightDirectionTop;
			uniform vec3 lightDirectionBottom;
			uniform vec3 lightColorTop;
			uniform vec3 lightColorBottom;
			uniform vec3 ambientLightColor;


			// Bilinear interpolation function
			float interpolateHeight(vec2 uv) {
				ivec2 texSize = textureSize(heightMapTexture, 0);
				vec2 texSizeFloat = vec2(texSize); // Convert ivec2 to vec2
				vec2 uvInTexels = uv * texSizeFloat;
				vec2 frac = fract(uvInTexels);
				vec2 baseUV = uvInTexels - frac;
				vec4 h00 = texture2D(heightMapTexture, baseUV / texSizeFloat);
				vec4 h10 = texture2D(heightMapTexture, (baseUV + vec2(1.0, 0.0)) / texSizeFloat);
				vec4 h01 = texture2D(heightMapTexture, (baseUV + vec2(0.0, 1.0)) / texSizeFloat);
				vec4 h11 = texture2D(heightMapTexture, (baseUV + vec2(1.0, 1.0)) / texSizeFloat);
				return mix(mix(h00.r, h10.r, frac.x), mix(h01.r, h11.r, frac.x), frac.y);
			}


			void main(void) {
				vec3 displacedPosition = vPosition;
				vec2 uvOnGround = vec2((displacedPosition.x + groundPlaneSize.x * 0.5) / groundPlaneSize.x, (displacedPosition.z + groundPlaneSize.y * 0.5) / groundPlaneSize.y);
				float interpolatedHeight = interpolateHeight(uvOnGround);
				float displacementHeight = minHeight + (maxHeight - minHeight) * interpolatedHeight;

				if (displacedPosition.y >= displacementHeight-maxHeight) {
					discard;
				} else {
					vec4 diffuseColor = texture2D(diffuseTexture, vUV);
					vec3 normal = texture2D(bumpTexture, vUV).rgb * 1.0 - 1.0;
					float lightIntensityTop = max(dot(normal, -lightDirectionTop), 0.0);
					float lightIntensityBottom = max(dot(normal, -lightDirectionBottom), 0.0);
					gl_FragColor = vec4(diffuseColor.rgb * (ambientLightColor + lightColorTop * lightIntensityTop + lightColorBottom * lightIntensityBottom), 1.0);


				}
			}
		`;
		const dirtShaderMaterial = new BABYLON.ShaderMaterial(
			'shader',
			this._scene,
			{
				vertexSource: customVertexShader,
				fragmentSource: customFragmentShader
			},
			{
				attributes: ['position', 'uv', 'normal'],
				uniforms: [
					'worldViewProjection',
					'heightMapTexture',
					'minHeight',
					'maxHeight',
					'diffuseTexture',
					'bumpTexture',
					'lightDirectionTop',
					'lightDirectionBottom',
					'lightColorTop',
					'lightColorBottom',
					'ambientLightColor'
				]
			}
		);

		const displacementTexture = new BABYLON.Texture(terrainURL, this._scene);
		displacementTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		displacementTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
		const diffuseTexture = new BABYLON.Texture(groundColorImg, this._scene);
		const bumpTexture = new BABYLON.Texture(groundNormalImg, this._scene);

		dirtShaderMaterial.setFloat('minHeight', 0);
		dirtShaderMaterial.setFloat('maxHeight', this.parcelDimensions.depth);
		dirtShaderMaterial.setTexture('heightMapTexture', displacementTexture);
		dirtShaderMaterial.setTexture('diffuseTexture', diffuseTexture);
		dirtShaderMaterial.setTexture('bumpTexture', bumpTexture);
		dirtShaderMaterial.setVector2(
			'groundPlaneSize',
			new BABYLON.Vector2(this.parcelDimensions.width, this.parcelDimensions.height)
		);

		const lightDirectionTop = this._light_top.direction;
		dirtShaderMaterial.setVector3('lightDirectionTop', lightDirectionTop.normalize());
		dirtShaderMaterial.setColor3('lightColorTop', this._light_top.diffuse);
		const lightDirectionBottom = this._light_bottom.direction;
		dirtShaderMaterial.setVector3('lightDirectionBottom', lightDirectionBottom.normalize());
		dirtShaderMaterial.setColor3('lightColorBottom', this._light_bottom.diffuse);
		// dirtShaderMaterial.setColor3('ambientLightColor', new BABYLON.Color3(0.02, 0.02, 0.02));

		return dirtShaderMaterial;
	}

	checkMeshesAndMaterialsReady(callback: () => void): void {
		const checkForTheseMeshes = [this.groundPlane, this.dirtMesh];
		const checkForTheseMaterials = [
			this.groundPlane.material as BABYLON.StandardMaterial
			// this.dirtMesh.material as BABYLON.ShaderMaterial
		];

		let numberReady = 0;
		checkForTheseMeshes.forEach((mesh) => {
			mesh.onMeshReadyObservable.addOnce(() => {
				numberReady++;
				checkReady();
			});
		});
		checkForTheseMaterials.forEach((material) => {
			material.onEffectCreatedObservable.addOnce(() => {
				numberReady++;
				checkReady();
			});
		});

		function checkReady() {
			const allReady = numberReady === checkForTheseMeshes.length + checkForTheseMaterials.length;
			console.log('numberReady: ', numberReady);
			if (allReady) callback();
		}
	}

	async exportScene(fileName: string): Promise<void> {
		try {
			const gltf = await GLTF2Export.GLBAsync(this._scene, fileName);
			gltf.downloadFiles();
		} catch (error) {
			console.error('Error exporting scene:', error);
		}
	}
}

export class Marker {
	spriteActive: BABYLON.Sprite;
	spriteDefault: BABYLON.Sprite;
	spriteLoading: BABYLON.Sprite;
	sphereMesh: BABYLON.Mesh | null = null;
	sphereMaterial: BABYLON.StandardMaterial | null = null;

	constructor(
		public babylonScene: BabylonScene,
		public lon: number,
		public lat: number,
		public imageUrl: string | null,
		public boundaryCoords: number[][][][],
		public active = false,
		public pano = false,
		public parcelCoordinateHelper: ParcelCoordinateHelper
	) {
		this.spriteActive = this.createSprite(
			'https://api.iconify.design/ic/twotone-where-to-vote.svg?color=white&width=100',
			this.lon,
			this.lat,
			false
		);
		this.spriteDefault = this.createSprite(
			'https://api.iconify.design/mdi/map-marker.svg?color=white&width=100',
			this.lon,
			this.lat
		);
		this.spriteLoading = this.createSprite('/spinner.svg', this.lon, this.lat, false);
		this.spriteLoading.isVisible = true;
		this.animateLoadingSpinner();

		if (this.pano) {
			this.createSphere();
		} else if (this.imageUrl) {
			// preload image to avoid flickering
			const img = new Image();
			img.src = this.imageUrl;
			img.onload = () => {
				this.spriteLoading.isVisible = false;
				this.changeState();
				console.log('img loaded');
			};
		}
		this.babylonScene.markers.push(this);
		this.spriteReactivity();
	}

	spriteReactivity(): void {
		this.babylonScene._scene.onPointerDown = () => {
			const pickResult = this.babylonScene._scene.pickSprite(
				this.babylonScene._scene.pointerX,
				this.babylonScene._scene.pointerY
			);
			if (pickResult?.hit && pickResult.pickedSprite) {
				this.babylonScene.markers.forEach((marker) => {
					marker.active = [marker.spriteDefault, marker.spriteActive].includes(
						pickResult.pickedSprite as BABYLON.Sprite
					);
					marker.changeState();
				});
			}
		};
	}

	createSprite(iconUrl: string, lon: number, lat: number, hoverEffects = true): BABYLON.Sprite {
		const spriteManager = new BABYLON.SpriteManager(
			`SpriteManagerName`,
			iconUrl,
			1,
			{
				width: 100,
				height: 100
			},
			this.babylonScene._scene
		);
		spriteManager.isPickable = true;
		const sprite = new BABYLON.Sprite(`SpriteName`, spriteManager);
		sprite.width = 7;
		sprite.height = 7;
		sprite.cellIndex = 0;
		sprite.isVisible = false;

		// change sprite color on hover (also automatically changes cursor)
		if (hoverEffects) {
			sprite.actionManager = new BABYLON.ActionManager(this.babylonScene._scene);
			sprite.actionManager?.registerAction(
				new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (ev) => {
					const sprite = ev.source as BABYLON.Sprite;
					sprite.color = new BABYLON.Color4(232 / 255, 245 / 255, 230 / 255, 1);
					sprite.width = 10;
					sprite.height = 10;
				})
			);
			sprite.actionManager?.registerAction(
				new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (ev) => {
					const sprite = ev.source as BABYLON.Sprite;
					sprite.color = new BABYLON.Color4(1, 1, 1, 1);
					sprite.width = 7;
					sprite.height = 7;
				})
			);
		}

		// set sprite position
		let [xPos, zPos] = this.parcelCoordinateHelper.coordRelativeToBounds([lon, lat]);
		const dimensions = this.parcelCoordinateHelper.meterDimensions;
		const modelSize = 100;
		const xScale = Math.min(dimensions.x / dimensions.y, 1);
		const yScale = Math.min(dimensions.y / dimensions.x, 1);
		xPos = xPos * xScale * modelSize;
		zPos = zPos * yScale * modelSize;
		const origin = new BABYLON.Vector3(xPos, 100, zPos);
		const direction = new BABYLON.Vector3(0, -1, 0);
		const ray = new BABYLON.Ray(origin, direction);
		const hit = this.babylonScene.groundPlane.intersects(ray, false);
		const yPos = hit?.pickedPoint?.y || 0;
		sprite.position = new BABYLON.Vector3(xPos, yPos + sprite.width / 2, zPos);

		return sprite;
	}

	changeState(): void {
		if (this.spriteLoading.isVisible) return;
		if (this.active) {
			this.spriteActive.isVisible = true;
			this.spriteActive.isPickable = true;
			this.spriteDefault.isVisible = false;
			this.spriteDefault.isPickable = false;
			this.active = true;
			if (this.sphereMesh) {
				this.sphereMesh.isVisible = true;
			} else {
				this.babylonScene.canvas.style.backgroundImage = `url("${this.imageUrl}")`;
				this.babylonScene._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
			}
		} else {
			this.spriteActive.isVisible = false;
			this.spriteActive.isPickable = false;
			this.spriteDefault.isVisible = true;
			this.spriteDefault.isPickable = true;
			this.active = false;
			if (this.sphereMesh) {
				this.sphereMesh.isVisible = false;
			}
		}
	}

	animateLoadingSpinner(): void {
		this.babylonScene._scene.registerBeforeRender(() => {
			if (this.spriteLoading.isVisible) {
				this.spriteLoading.angle += 0.05;
			}
		});
	}

	createSphere(): void {
		this.sphereMesh = BABYLON.MeshBuilder.CreateSphere(
			'sphere',
			{ diameter: 10000 },
			this.babylonScene._scene
		);
		this.sphereMaterial = new BABYLON.StandardMaterial('material', this.babylonScene._scene);
		this.sphereMaterial.backFaceCulling = false;
		this.sphereMesh.material = this.sphereMaterial;

		this.sphereMaterial.diffuseTexture = null;
		if (this.babylonScene.backgroundColor3) {
			this.sphereMaterial.diffuseColor = this.babylonScene.backgroundColor3;
		}
		if (this.imageUrl) {
			this.applyTextureToSphere();
		}
	}

	async loadTextureAsync(): Promise<BABYLON.Texture> {
		return new Promise((resolve) => {
			const texture = new BABYLON.Texture(this.imageUrl, this.babylonScene._scene);
			texture.onLoadObservable.addOnce(() => {
				resolve(texture);
			});
		});
	}

	async applyTextureToSphere() {
		const texture = await this.loadTextureAsync();
		texture.vScale = -1;
		const material = this.sphereMesh?.material as BABYLON.StandardMaterial;
		material.diffuseTexture = texture;
		material.diffuseColor = new BABYLON.Color3(1, 1, 1);
		// Hide the loading spinner after the image is loaded
		this.spriteLoading.isVisible = false;
		this.changeState();
	}
}
