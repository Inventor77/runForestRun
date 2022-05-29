const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(
	window.innerWidth / -2,
	window.innerWidth / 2,
	window.innerHeight / 2,
	window.innerHeight / -2,
	0.1,
	10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
	Math.tan(camera.rotation.y) *
	Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2.5;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [
	{ x: 10, y: 0, w: 50, h: 30 },
	{ x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = new Texture(110, 40, [
	{ x: 10, y: 10, w: 50, h: 30 },
	{ x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [
	{ x: 0, y: 15, w: 10, h: 10 },
]);
const truckLeftSideTexture = new Texture(25, 30, [
	{ x: 0, y: 5, w: 10, h: 10 },
]);

const generateLanes = () =>
	[-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		.map((index) => {
			const lane = new Lane(index);
			lane.mesh.position.y = index * positionWidth * zoom;
			scene.add(lane.mesh);
			return lane;
		})
		.filter((lane) => lane.index >= 0);

const addLane = () => {
	const index = lanes.length;
	const lane = new Lane(index);
	lane.mesh.position.y = index * positionWidth * zoom;
	scene.add(lane.mesh);
	lanes.push(lane);
};

const chicken = new Chicken();
scene.add(chicken);

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const laneTypes = ["car", "truck", "forest"];
const laneSpeeds = [2, 2.5, 3];
const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const threeHeights = [20, 45, 60];

const initaliseValues = () => {
	lanes = generateLanes();

	currentLane = 0;
	currentColumn = Math.floor(columns / 2);

	previousTimestamp = null;

	startMoving = false;
	moves = [];
	stepStartTimestamp;

	chicken.position.x = 0;
	chicken.position.y = 0;

	camera.position.y = initialCameraPositionY;
	camera.position.x = initialCameraPositionX;

	dirLight.position.x = initialDirLightPositionX;
	dirLight.position.y = initialDirLightPositionY;
};

initaliseValues();

const renderer = new THREE.WebGLRenderer({
	alpha: true,
	antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function Texture(width, height, rects) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, width, height);
	context.fillStyle = "rgba(0,0,0,0.6)";
	rects.forEach((rect) => {
		context.fillRect(rect.x, rect.y, rect.w, rect.h);
	});
	return new THREE.CanvasTexture(canvas);
}

function Wheel() {
	const wheel = new THREE.Mesh(
		new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
		new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
	);
	wheel.position.z = 6 * zoom;
	return wheel;
}

function Car() {
	const car = new THREE.Group();
	const color =
		vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

	const main = new THREE.Mesh(
		new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom),
		new THREE.MeshPhongMaterial({ color, flatShading: true })
	);
	main.position.z = 12 * zoom;
	main.castShadow = true;
	main.receiveShadow = true;
	car.add(main);

	const cabin = new THREE.Mesh(
		new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom),
		[
			new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				flatShading: true,
				map: carBackTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				flatShading: true,
				map: carFrontTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				flatShading: true,
				map: carRightSideTexture,
			}),
			new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				flatShading: true,
				map: carLeftSideTexture,
			}),
			new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
			new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // bottom
		]
	);
	cabin.position.x = 6 * zoom;
	cabin.position.z = 25.5 * zoom;
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	car.add(cabin);

	const frontWheel = new Wheel();
	frontWheel.position.x = -18 * zoom;
	car.add(frontWheel);

	const backWheel = new Wheel();
	backWheel.position.x = 18 * zoom;
	car.add(backWheel);

	car.castShadow = true;
	car.receiveShadow = false;

	return car;
}

function Truck() {
	const truck = new THREE.Group();
	const color =
		vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

	const base = new THREE.Mesh(
		new THREE.BoxBufferGeometry(100 * zoom, 25 * zoom, 5 * zoom),
		new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
	);
	base.position.z = 10 * zoom;
	truck.add(base);

	const cargo = new THREE.Mesh(
		new THREE.BoxBufferGeometry(75 * zoom, 35 * zoom, 40 * zoom),
		new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true })
	);
	cargo.position.x = 15 * zoom;
	cargo.position.z = 30 * zoom;
	cargo.castShadow = true;
	cargo.receiveShadow = true;
	truck.add(cargo);

	const cabin = new THREE.Mesh(
		new THREE.BoxBufferGeometry(25 * zoom, 30 * zoom, 30 * zoom),
		[
			new THREE.MeshPhongMaterial({ color, flatShading: true }), // back
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckFrontTexture,
			}),
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckRightSideTexture,
			}),
			new THREE.MeshPhongMaterial({
				color,
				flatShading: true,
				map: truckLeftSideTexture,
			}),
			new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
			new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
		]
	);
	cabin.position.x = -40 * zoom;
	cabin.position.z = 20 * zoom;
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	truck.add(cabin);

	const frontWheel = new Wheel();
	frontWheel.position.x = -38 * zoom;
	truck.add(frontWheel);

	const middleWheel = new Wheel();
	middleWheel.position.x = -10 * zoom;
	truck.add(middleWheel);

	const backWheel = new Wheel();
	backWheel.position.x = 30 * zoom;
	truck.add(backWheel);

	return truck;
}

function Three() {
	const three = new THREE.Group();

	const trunk = new THREE.Mesh(
		new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
		new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
	);
	trunk.position.z = 10 * zoom;
	trunk.castShadow = true;
	trunk.receiveShadow = true;
	three.add(trunk);

	height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

	const crown = new THREE.Mesh(
		new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
		new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
	);
	crown.position.z = (height / 2 + 20) * zoom;
	crown.castShadow = true;
	crown.receiveShadow = false;
	three.add(crown);

	return three;
}
// Chicken
function Chicken() {
	const chicken = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.BoxBufferGeometry(
			chickenSize * zoom,
			chickenSize * zoom,
			20 * zoom
		),
		new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
	);
	body.position.z = 10 * zoom;
	body.castShadow = true;
	body.receiveShadow = true;
	chicken.add(body);
	const rowel = new THREE.Mesh(
		new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom),
		new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true })
	);
	rowel.position.z = 21 * zoom;
	rowel.castShadow = true;
	rowel.receiveShadow = false;
	chicken.add(rowel);
	return chicken;
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////

// Materials
const materialDarkest = new THREE.MeshPhongMaterial({ color: 0x33281b });
const materialDark = new THREE.MeshPhongMaterial({ color: 0x664e31 });
const materialLight = new THREE.MeshPhongMaterial({ color: 0xa3835b });
const steelMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
const skinMaterial = new THREE.MeshPhongMaterial({
	color: 0xffdbac,
	flatShading: false,
});

// Canvas Renderer
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMapEnabled = true;
// renderer.shadowMapSoft = true;

// renderer.shadowCameraNear = 1;
// renderer.shadowCameraFar = 500;
// renderer.shadowCameraFov = 60;

// renderer.shadowMapBias = 0.05;
// renderer.shadowMapDarkness = 1;
// renderer.shadowMapWidth = 512;
// renderer.shadowMapHeight = 512;
// document.getElementById("background").appendChild(renderer.domElement);
// camera.position.z = 12;

// Weapons
function axe() {
	const axeHandleGeo = new THREE.BoxGeometry(7, 0.25, 0.25);
	const handle = new THREE.Mesh(axeHandleGeo, materialLight);
	const axeShape = new THREE.Shape();

	axeShape.moveTo(0, 0.15);
	axeShape.lineTo(1, 1);
	axeShape.lineTo(1.25, 0.5);
	axeShape.lineTo(1.25, -0.5);
	axeShape.lineTo(1, -1);
	axeShape.lineTo(0, -0.15);

	const extrudeSettings = {
		steps: 2,
		depth: 0.05,
		bevelEnabled: true,
		bevelThickness: 0.25,
		bevelSize: 0.5,
		bevelOffset: 0,
		bevelSegments: 1,
	};

	const axeGeo = new THREE.ExtrudeBufferGeometry(axeShape, extrudeSettings);
	const buttGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
	const butt1 = new THREE.Mesh(buttGeo, steelMaterial);
	const butt2 = new THREE.Mesh(buttGeo, steelMaterial);
	const butt3 = new THREE.Mesh(buttGeo, steelMaterial);
	const axe1 = new THREE.Mesh(axeGeo, steelMaterial);
	const axe2 = new THREE.Mesh(axeGeo, steelMaterial);

	axe1.castShadow = true;
	axe2.castShadow = true;
	handle.castShadow = true;

	const group = new THREE.Group();

	group.add(handle);
	group.add(axe1);
	group.add(axe2);
	group.add(butt1);
	group.add(butt2);
	group.add(butt3);

	axe1.position.set(2.75, 0.4, 0);
	axe1.rotation.z = Math.PI / 2;
	axe2.position.set(2.75, -0.4, 0);
	axe2.rotation.z = -Math.PI / 2;
	butt2.position.set(-3.5, 0, 0);
	butt3.position.set(3.5, 0, 0);

	return group;
}

function sword() {
	const handleGeo1 = new THREE.BoxGeometry(1.5, 0.25, 0.25);
	const handle1 = new THREE.Mesh(handleGeo1, materialLight);

	const handleGeo2 = new THREE.BoxGeometry(0.25, 2, 0.25);
	const handle2 = new THREE.Mesh(handleGeo2, materialLight);

	const shape = new THREE.Shape();
	const extrudeSettings = {
		steps: 2,
		depth: 0.05,
		bevelEnabled: true,
		bevelThickness: 0.25,
		bevelSize: 0.5,
		bevelOffset: 0,
		bevelSegments: 1,
	};

	shape.moveTo(0, 0.1);
	shape.lineTo(4, 0.5);
	shape.lineTo(4.5, 0);
	shape.lineTo(4, -0.5);
	shape.lineTo(0, -0.1);

	const bladeGeo = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
	const blade = new THREE.Mesh(bladeGeo, steelMaterial);

	const group = new THREE.Group();

	handle1.position.set(-0.85, 0.0, 0);
	blade.position.set(0.5, 0, 0);

	handle1.castShadow = true;
	blade.castShadow = true;
	handle2.castShadow = true;

	group.add(blade);
	group.add(handle1);
	group.add(handle2);

	group.position.set(-0.5, 0, -0.05);
	group.rotation.x = Math.PI / 6;

	return group;
}

// Legs
function pegLeg() {
	const pegLegGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
	const leg = new THREE.Mesh(pegLegGeo, materialLight);

	const stumpUpperGeo = new THREE.BoxGeometry(1, 0.75, 1);
	const stumpUpper = new THREE.Mesh(stumpUpperGeo, materialLight);

	const stumpMaterial = new THREE.MeshPhongMaterial({ color: 0x26211a });
	const stumpGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
	const stump = new THREE.Mesh(stumpGeo, stumpMaterial);

	const group = new THREE.Group();

	stump.position.set(1, -4.65, -0.34);
	leg.position.set(1, -3.75, -0.35);
	stumpUpper.position.set(1, -3.1, -0.35);

	group.add(stump);
	group.add(leg);
	group.add(stumpUpper);

	return group;
}

function rightLeg() {
	const legGeo = new THREE.BoxGeometry(1.25, 1, 1.4);
	const legRight = new THREE.Mesh(legGeo, materialDark);

	const bootGeo1 = new THREE.BoxGeometry(1, 0.8, 1);
	const bootGeo2 = new THREE.BoxGeometry(1, 0.45, 1);

	const bootTopRight = new THREE.Mesh(bootGeo1, materialDarkest);
	const bootBottomRight = new THREE.Mesh(bootGeo2, materialDarkest);

	const group = new THREE.Group();

	legRight.castShadow = true;
	bootTopRight.castShadow = true;
	bootBottomRight.castShadow = true;

	legRight.position.set(0.75, -3.5, -0.35);

	group.add(legRight);
	group.add(bootTopRight);
	group.add(bootBottomRight);

	bootTopRight.position.set(0.75, -4.4, -0.35);
	bootBottomRight.position.set(0.75, -4.58, 0.1);

	return group;
}

// Customisations
let legOptionsOpen = false;
let weaponOptionsOpen = false;

let applyedLeg = rightLeg();
let applyedWeapon = axe();

// Functions
function addLights() {
	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4, 100);
	const light = new THREE.HemisphereLight(0xffffff, 0xb3858c, 0.9);

	scene.add(light);
	scene.add(directionalLight);

	directionalLight.position.set(8, 8, 2);
	directionalLight.castShadow = true;

	directionalLight.shadow.mapSize.width = 512; // default
	directionalLight.shadow.mapSize.height = 512; // default
	directionalLight.shadow.camera.near = 0.5; // default
	directionalLight.shadow.camera.far = 500;
}

function addPlane() {
	const material = new THREE.MeshStandardMaterial({ color: 0x363636 });
	const planeGeo = new THREE.PlaneBufferGeometry(20, 20, 32, 32);
	const plane = new THREE.Mesh(planeGeo, material);

	scene.add(plane);

	plane.receiveShadow = true;
	plane.rotation.x = -Math.PI / 2;
	plane.position.set(0, -4.74, 0);
}

function addHead() {
	const headGeo = new THREE.BoxGeometry(1.5, 1.5, 1.2);
	const head = new THREE.Mesh(headGeo, skinMaterial);

	const browGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
	const brow = new THREE.Mesh(browGeo, skinMaterial);

	const noseGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
	const nose = new THREE.Mesh(noseGeo, skinMaterial);

	scene.add(head);
	scene.add(brow);
	scene.add(nose);

	head.castShadow = true;
	head.receiveShadow = true;
	brow.castShadow = true;
	nose.castShadow = true;

	head.position.set(0, 2, 0);
	brow.position.set(0, 2.43, 0.46);
	nose.position.set(0, 2.05, 0.54);

	brow.rotation.x = 130;
}

function addBeard() {
	const material = new THREE.MeshPhongMaterial({
		color: 0xcc613d,
		flatShading: true,
	});

	const shape1 = new THREE.Shape();
	const shape2 = new THREE.Shape();

	shape1.moveTo(-0.75, 0);
	shape1.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.15, -1.5);
	shape1.lineTo(-2, -1.5);
	shape1.lineTo(-2, 0);

	shape2.moveTo(-0.75, 0);
	shape2.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.25, -1.25);
	shape2.lineTo(-2, -1.25);
	shape2.lineTo(-2, 0);

	const primarySettings = {
		steps: 2,
		depth: 1,
		bevelEnabled: false,
	};

	const secondarySettings = {
		steps: 2,
		depth: 1,
		bevelEnabled: false,
	};

	const primaryBeardGeo = new THREE.ExtrudeBufferGeometry(
		shape1,
		primarySettings
	);
	const primaryBeard = new THREE.Mesh(primaryBeardGeo, material);

	const secondaryBeardGeo = new THREE.ExtrudeBufferGeometry(
		shape2,
		secondarySettings
	);
	const secondaryBeardLeft = new THREE.Mesh(secondaryBeardGeo, material);
	const secondaryBeardRight = new THREE.Mesh(secondaryBeardGeo, material);

	scene.add(primaryBeard);
	scene.add(secondaryBeardLeft);
	scene.add(secondaryBeardRight);

	primaryBeard.castShadow = true;
	secondaryBeardLeft.castShadow = true;
	secondaryBeardRight.castShadow = true;

	primaryBeard.position.set(0.5, 1.5, 1.65);
	secondaryBeardLeft.position.set(1.1, 1.4, 1.3);
	secondaryBeardRight.position.set(-0.18, 1.4, 1.55);

	primaryBeard.rotation.y = -Math.PI / 2;
	secondaryBeardLeft.rotation.y = -Math.PI / 2 + 0.25;
	secondaryBeardRight.rotation.y = -Math.PI / 2 - 0.25;
}

function addMustache() {
	const material = new THREE.MeshPhongMaterial({
		color: 0xcc613d,
		flatShading: true,
	});

	const mustacheGeo = new THREE.BoxGeometry(0.6, 0.2, 0.25);
	const mustacheLeft = new THREE.Mesh(mustacheGeo, material);
	const mustacheRight = new THREE.Mesh(mustacheGeo, material);

	scene.add(mustacheLeft);
	scene.add(mustacheRight);

	mustacheLeft.position.set(-0.25, 1.55, 0.7);
	mustacheRight.position.set(0.25, 1.55, 0.7);

	mustacheLeft.rotation.z = Math.PI / 8;
	mustacheRight.rotation.z = -Math.PI / 8;
}

function addHelmet() {
	const boneMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f0f0 });

	const helmetGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
	const helmet = new THREE.Mesh(helmetGeo, steelMaterial);

	const hornGeo = new THREE.BoxGeometry(1.1, 0.25, 0.25);
	const hornLeftBottom = new THREE.Mesh(hornGeo, boneMaterial);
	const hornLeftTop = new THREE.Mesh(hornGeo, boneMaterial);

	scene.add(helmet);
	scene.add(hornLeftBottom);
	scene.add(hornLeftTop);

	helmet.position.set(0, 3, 0);
	hornLeftBottom.position.set(-0.75, 3.1, 0);
	hornLeftTop.position.set(-1.3, 3.6, 0);

	hornLeftTop.rotation.z = Math.PI / 2 + 0.25;
}

function addBody() {
	const shape1 = new THREE.Shape();
	const shape2 = new THREE.Shape();

	shape1.moveTo(-2, -0.5);
	shape1.lineTo(-1.5, -3.5);
	shape1.lineTo(1.5, -3.5);
	shape1.lineTo(2, -0.5);
	shape1.lineTo(2, 0);
	shape1.lineTo(2, 0.5);
	shape1.lineTo(-2, 0.5);
	shape1.lineTo(-2, 0);

	shape2.moveTo(-1.95, -0.5);
	shape2.lineTo(-1.5, -1.25);
	shape2.lineTo(1.5, -1.25);
	shape2.lineTo(1.9, -0.5);
	shape2.lineTo(1.95, 0);
	shape2.lineTo(1.95, 0.5);
	shape2.lineTo(-1.95, 0.5);
	shape2.lineTo(-1.95, 0);

	const extrudeSettings = {
		steps: 2,
		depth: 1.75,
		bevelEnabled: false,
	};

	const bodyGeo = new THREE.ExtrudeBufferGeometry(shape1, extrudeSettings);
	const body = new THREE.Mesh(bodyGeo, skinMaterial);

	const upperBodyGeo = new THREE.ExtrudeBufferGeometry(shape2, extrudeSettings);
	const upperBody = new THREE.Mesh(upperBodyGeo, skinMaterial);

	const beltGeo = new THREE.BoxGeometry(3.5, 0.5, 2.1);
	const belt = new THREE.Mesh(beltGeo, steelMaterial);

	scene.add(body);
	scene.add(upperBody);
	scene.add(belt);

	body.castShadow = true;
	upperBody.castShadow = true;
	belt.castShadow = true;

	upperBody.receiveShadow = true;
	body.receiveShadow = true;
	belt.receiveShadow = true;

	body.position.set(0, 0.75, -1.25);
	upperBody.position.set(0, 0.525, -1.155);
	belt.position.set(0, -2.5, -0.4);

	upperBody.rotation.x = -Math.PI / 24;
}

function addLeftArm() {
	const bicepGeo = new THREE.BoxGeometry(2.5, 1, 1);
	const bicep = new THREE.Mesh(bicepGeo, skinMaterial);
	const foreArmGeo = new THREE.BoxGeometry(2.5, 1.25, 1.25);
	const foreArm = new THREE.Mesh(foreArmGeo, skinMaterial);

	scene.add(bicep);
	scene.add(foreArm);

	bicep.castShadow = true;
	foreArm.castShadow = true;

	bicep.position.set(-2, 0, 0.2);
	bicep.rotation.z = Math.PI / 4;
	bicep.rotation.y = Math.PI / 4;

	foreArm.position.set(-2.4, 0, 1.2);
	foreArm.rotation.z = -Math.PI / 2 - 0.3;
	foreArm.rotation.x = Math.PI / 8;
}

function addRightArm() {
	const bicepGeo = new THREE.BoxGeometry(2.5, 1, 1);
	const bicep = new THREE.Mesh(bicepGeo, skinMaterial);
	const foreArmGeo = new THREE.BoxGeometry(2.5, 1.25, 1.25);
	const foreArm = new THREE.Mesh(foreArmGeo, skinMaterial);

	scene.add(bicep);
	scene.add(foreArm);

	bicep.castShadow = true;
	foreArm.castShadow = true;

	bicep.position.set(2, 0, -0.25);
	bicep.rotation.z = -Math.PI / 4;
	bicep.rotation.y = -Math.PI / 8;

	foreArm.position.set(2.4, -1.5, 0.42);
	foreArm.rotation.z = Math.PI / 2 - 0.3;
	foreArm.rotation.x = -Math.PI / 8;
}

function addArms() {
	addLeftArm();
	addRightArm();
}

function addLegs() {
	const pantsGeo = new THREE.BoxGeometry(3.25, 0.6, 1.8);
	const pants = new THREE.Mesh(pantsGeo, materialDark);

	const legGeo = new THREE.BoxGeometry(1.25, 1, 1.4);
	const legLeft = new THREE.Mesh(legGeo, materialDark);

	const bootGeo1 = new THREE.BoxGeometry(1, 0.8, 1);
	const bootGeo2 = new THREE.BoxGeometry(1, 0.45, 1);

	const bootTopLeft = new THREE.Mesh(bootGeo1, materialDarkest);
	const bootBottomLeft = new THREE.Mesh(bootGeo2, materialDarkest);

	scene.add(pants);
	scene.add(legLeft);
	scene.add(applyedLeg);
	scene.add(bootTopLeft);
	scene.add(bootBottomLeft);

	pants.castShadow = true;
	legLeft.castShadow = true;
	bootTopLeft.castShadow = true;
	bootBottomLeft.castShadow = true;

	pants.position.set(0, -2.75, -0.4);
	legLeft.position.set(-0.75, -3.5, -0.35);
	bootTopLeft.position.set(-0.75, -4.4, -0.35);
	bootBottomLeft.position.set(-0.75, -4.58, 0.1);
}

function addWeapon() {
	const group = new THREE.Group();

	group.add(applyedWeapon);

	scene.add(group);

	group.position.set(-1.8, 1.5, 0);
	group.rotation.y = Math.PI / 2;
	group.rotation.x = Math.PI / 12;
}

// function animate() {
// 	requestAnimationFrame(animate);

// 	renderer.render(scene, camera);
// }

function toggleLegsMenu() {
	const element = document.querySelector(".leg-options");
	const signElement = document.querySelector(".add-sign-legs");

	legOptionsOpen = !legOptionsOpen;

	element.style.visibility = legOptionsOpen ? "visible" : "hidden";
	element.style.opacity = legOptionsOpen ? 1 : 0;
	signElement.style.transform = legOptionsOpen
		? "rotate(45deg)"
		: "rotate(0deg)";
}

function toggleWeaponsMenu() {
	const element = document.querySelector(".weapon-options");
	const signElement = document.querySelector(".add-sign-weapon");

	weaponOptionsOpen = !weaponOptionsOpen;

	element.style.visibility = weaponOptionsOpen ? "visible" : "hidden";
	element.style.opacity = weaponOptionsOpen ? 1 : 0;
	signElement.style.transform = weaponOptionsOpen
		? "rotate(45deg)"
		: "rotate(0deg)";
}

function applyLegs(value) {
	const legs = {
		0: rightLeg(),
		1: pegLeg(),
	};

	applyedLeg = legs[value];
	draw();
}

function applyWeapon(value) {
	const weapons = {
		0: axe(),
		1: sword(),
	};

	applyedWeapon = weapons[value];
	draw();
}

function draw() {
	// scene.remove.apply(scene, scene.children);
	addHead();
	addBeard();
	addMustache();
	addBody();
	addArms();
	addLegs();
	addWeapon();
	addLights();
	addPlane();
}

// animate();
draw();

// window.addEventListener("resize", onWindowResize, false);

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();

// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }

// /////////////////////////////////////////////////////////////////////////////////////////////////////////

function Road() {
	const road = new THREE.Group();

	const createSection = (color) =>
		new THREE.Mesh(
			new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
			new THREE.MeshPhongMaterial({ color })
		);

	const middle = createSection(0x454a59);
	middle.receiveShadow = true;
	road.add(middle);

	const left = createSection(0x393d49);
	left.position.x = -boardWidth * zoom;
	road.add(left);

	const right = createSection(0x393d49);
	right.position.x = boardWidth * zoom;
	road.add(right);

	return road;
}

function Grass() {
	const grass = new THREE.Group();

	const createSection = (color) =>
		new THREE.Mesh(
			new THREE.BoxBufferGeometry(
				boardWidth * zoom,
				positionWidth * zoom,
				3 * zoom
			),
			new THREE.MeshPhongMaterial({ color })
		);

	const middle = createSection(0xbaf455);
	middle.receiveShadow = true;
	grass.add(middle);

	const left = createSection(0x99c846);
	left.position.x = -boardWidth * zoom;
	grass.add(left);

	const right = createSection(0x99c846);
	right.position.x = boardWidth * zoom;
	grass.add(right);

	grass.position.z = 1.5 * zoom;
	return grass;
}

function Lane(index) {
	this.index = index;
	this.type =
		index <= 0
			? "field"
			: laneTypes[Math.floor(Math.random() * laneTypes.length)];

	switch (this.type) {
		case "field": {
			this.type = "field";
			this.mesh = new Grass();
			break;
		}
		case "forest": {
			this.mesh = new Grass();

			this.occupiedPositions = new Set();
			this.threes = [1, 2, 3, 4].map(() => {
				const three = new Three();
				let position;
				do {
					position = Math.floor(Math.random() * columns);
				} while (this.occupiedPositions.has(position));
				this.occupiedPositions.add(position);
				three.position.x =
					(position * positionWidth + positionWidth / 2) * zoom -
					(boardWidth * zoom) / 2;
				this.mesh.add(three);
				return three;
			});
			break;
		}
		case "car": {
			this.mesh = new Road();
			this.direction = Math.random() >= 0.5;

			const occupiedPositions = new Set();
			this.vechicles = [1, 2, 3].map(() => {
				const vechicle = new Car();
				let position;
				do {
					position = Math.floor((Math.random() * columns) / 2);
				} while (occupiedPositions.has(position));
				occupiedPositions.add(position);
				vechicle.position.x =
					(position * positionWidth * 2 + positionWidth / 2) * zoom -
					(boardWidth * zoom) / 2;
				if (!this.direction) vechicle.rotation.z = Math.PI;
				this.mesh.add(vechicle);
				return vechicle;
			});

			this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
			break;
		}
		case "truck": {
			this.mesh = new Road();
			this.direction = Math.random() >= 0.5;

			const occupiedPositions = new Set();
			this.vechicles = [1, 2].map(() => {
				const vechicle = new Truck();
				let position;
				do {
					position = Math.floor((Math.random() * columns) / 3);
				} while (occupiedPositions.has(position));
				occupiedPositions.add(position);
				vechicle.position.x =
					(position * positionWidth * 3 + positionWidth / 2) * zoom -
					(boardWidth * zoom) / 2;
				if (!this.direction) vechicle.rotation.z = Math.PI;
				this.mesh.add(vechicle);
				return vechicle;
			});

			this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
			break;
		}
	}
}

document.querySelector("#retry").addEventListener("click", () => {
	lanes.forEach((lane) => scene.remove(lane.mesh));
	initaliseValues();
	endDOM.style.visibility = "hidden";
});

document
	.getElementById("forward")
	.addEventListener("click", () => move("forward"));

document
	.getElementById("backward")
	.addEventListener("click", () => move("backward"));

document.getElementById("left").addEventListener("click", () => move("left"));

document.getElementById("right").addEventListener("click", () => move("right"));

window.addEventListener("keydown", (event) => {
	if (event.keyCode == "38") {
		// up arrow
		move("forward");
	} else if (event.keyCode == "40") {
		// down arrow
		move("backward");
	} else if (event.keyCode == "37") {
		// left arrow
		move("left");
	} else if (event.keyCode == "39") {
		// right arrow
		move("right");
	}
});

function move(direction) {
	const finalPositions = moves.reduce(
		(position, move) => {
			if (move === "forward")
				return { lane: position.lane + 1, column: position.column };
			if (move === "backward")
				return { lane: position.lane - 1, column: position.column };
			if (move === "left")
				return { lane: position.lane, column: position.column - 1 };
			if (move === "right")
				return { lane: position.lane, column: position.column + 1 };
		},
		{ lane: currentLane, column: currentColumn }
	);

	if (direction === "forward") {
		if (
			lanes[finalPositions.lane + 1].type === "forest" &&
			lanes[finalPositions.lane + 1].occupiedPositions.has(
				finalPositions.column
			)
		)
			return;
		if (!stepStartTimestamp) startMoving = true;
		addLane();
	} else if (direction === "backward") {
		if (finalPositions.lane === 0) return;
		if (
			lanes[finalPositions.lane - 1].type === "forest" &&
			lanes[finalPositions.lane - 1].occupiedPositions.has(
				finalPositions.column
			)
		)
			return;
		if (!stepStartTimestamp) startMoving = true;
	} else if (direction === "left") {
		if (finalPositions.column === 0) return;
		if (
			lanes[finalPositions.lane].type === "forest" &&
			lanes[finalPositions.lane].occupiedPositions.has(
				finalPositions.column - 1
			)
		)
			return;
		if (!stepStartTimestamp) startMoving = true;
	} else if (direction === "right") {
		if (finalPositions.column === columns - 1) return;
		if (
			lanes[finalPositions.lane].type === "forest" &&
			lanes[finalPositions.lane].occupiedPositions.has(
				finalPositions.column + 1
			)
		)
			return;
		if (!stepStartTimestamp) startMoving = true;
	}
	moves.push(direction);
}

function animate(timestamp) {
	requestAnimationFrame(animate);

	if (!previousTimestamp) previousTimestamp = timestamp;
	const delta = timestamp - previousTimestamp;
	previousTimestamp = timestamp;

	// Animate cars and trucks moving on the lane
	lanes.forEach((lane) => {
		if (lane.type === "car" || lane.type === "truck") {
			const aBitBeforeTheBeginingOfLane =
				(-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
			const aBitAfterTheEndOFLane =
				(boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
			lane.vechicles.forEach((vechicle) => {
				if (lane.direction) {
					vechicle.position.x =
						vechicle.position.x < aBitBeforeTheBeginingOfLane
							? aBitAfterTheEndOFLane
							: (vechicle.position.x -= (lane.speed / 16) * delta);
				} else {
					vechicle.position.x =
						vechicle.position.x > aBitAfterTheEndOFLane
							? aBitBeforeTheBeginingOfLane
							: (vechicle.position.x += (lane.speed / 16) * delta);
				}
			});
		}
	});

	if (startMoving) {
		stepStartTimestamp = timestamp;
		startMoving = false;
	}

	if (stepStartTimestamp) {
		const moveDeltaTime = timestamp - stepStartTimestamp;
		const moveDeltaDistance =
			Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
		const jumpDeltaDistance =
			Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
		switch (moves[0]) {
			case "forward": {
				const positionY =
					currentLane * positionWidth * zoom + moveDeltaDistance;
				camera.position.y = initialCameraPositionY + positionY;
				dirLight.position.y = initialDirLightPositionY + positionY;
				chicken.position.y = positionY; // initial chicken position is 0

				chicken.position.z = jumpDeltaDistance;
				break;
			}
			case "backward": {
				positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
				camera.position.y = initialCameraPositionY + positionY;
				dirLight.position.y = initialDirLightPositionY + positionY;
				chicken.position.y = positionY;

				chicken.position.z = jumpDeltaDistance;
				break;
			}
			case "left": {
				const positionX =
					(currentColumn * positionWidth + positionWidth / 2) * zoom -
					(boardWidth * zoom) / 2 -
					moveDeltaDistance;
				camera.position.x = initialCameraPositionX + positionX;
				dirLight.position.x = initialDirLightPositionX + positionX;
				chicken.position.x = positionX; // initial chicken position is 0
				chicken.position.z = jumpDeltaDistance;
				break;
			}
			case "right": {
				const positionX =
					(currentColumn * positionWidth + positionWidth / 2) * zoom -
					(boardWidth * zoom) / 2 +
					moveDeltaDistance;
				camera.position.x = initialCameraPositionX + positionX;
				dirLight.position.x = initialDirLightPositionX + positionX;
				chicken.position.x = positionX;

				chicken.position.z = jumpDeltaDistance;
				break;
			}
		}
		// Once a step has ended
		if (moveDeltaTime > stepTime) {
			switch (moves[0]) {
				case "forward": {
					currentLane++;
					counterDOM.innerHTML = currentLane;
					break;
				}
				case "backward": {
					currentLane--;
					counterDOM.innerHTML = currentLane;
					break;
				}
				case "left": {
					currentColumn--;
					break;
				}
				case "right": {
					currentColumn++;
					break;
				}
			}
			moves.shift();
			// If more steps are to be taken then restart counter otherwise stop stepping
			stepStartTimestamp = moves.length === 0 ? null : timestamp;
		}
	}

	// Hit test
	if (
		lanes[currentLane].type === "car" ||
		lanes[currentLane].type === "truck"
	) {
		const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
		const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
		const vechicleLength = { car: 60, truck: 105 }[lanes[currentLane].type];
		lanes[currentLane].vechicles.forEach((vechicle) => {
			const carMinX = vechicle.position.x - (vechicleLength * zoom) / 2;
			const carMaxX = vechicle.position.x + (vechicleLength * zoom) / 2;
			if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
				endDOM.style.visibility = "visible";
			}
		});
	}
	renderer.render(scene, camera);
}

requestAnimationFrame(animate);
