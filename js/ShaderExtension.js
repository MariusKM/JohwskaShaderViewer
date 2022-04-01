/*import * as THREE from 'https://cdn.skypack.dev/three@0.138.2/build/three.min.js';
//const THREE = await import('https://cdn.skypack.dev/three@0.138.0');
//import THREE from 'https://cdn.skypack.dev/three';

import Stats from 'https://cdn.skypack.dev/three@0.138.2/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://cdn.skypack.dev/three@0.138.2/examples/jsm/libs/lil-gui.module.min.js';

import { OrbitControls }  from 'https://cdn.skypack.dev/three@0.138.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from  'https://cdn.skypack.dev/three@0.138.2/examples/jsm/loaders/GLTFLoader.js';
*/

import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import  {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import {GUI} from 'dat.gui';


import { fragVars, fragTransmissionMod, fragLightMapMod, fragOutMod } from '../Shader/PhysicalShaderPatches.js';


let scene, renderer, light, light3;
let cameraP;
let gui, stats, speedVal;
let shoeMesh, shoeMat, refractionCube, reflectionCube;



const params = {

    Metalness: 0.5,
    Roughness: 0.5,
    EnvMapIntensity: 0.5,
    SceneLightStrength: 1,
    exposure: 1,
    transmission: 1,
    ior: 1.5,
    thickness: 2.5,
    reflectivity: 0.5,
    speed: 1.0,

};

init().catch(function (err) {

    console.error(err);

});



function clearGui() {

    if (gui) gui.destroy();

    gui = new GUI();

    gui.add(params, 'exposure', 0.1, 2).onChange(function (value) {

        renderer.toneMappingExposure = Math.pow(value, 4.0);
    });

    gui.add(params, 'Metalness', 0, 1).onChange(function (value) {

        shoeMat.metalness = value;
    });
    gui.add(params, 'Roughness', 0, 1).onChange(function (value) {

        shoeMat.roughness = value;

    });
    gui.add(params, 'SceneLightStrength', 0.1, 5).onChange(function (value) {

        light.intensity = value;
        light3.intensity = value;
    });

    gui.add(params, 'EnvMapIntensity', 0, 1).onChange(function (value) {

        shoeMat.envMapIntensity = value * 5;

    });
    gui.add(params, "speed", 0, 1.9, 0.01).onChange((val) => {
        speedVal = val;
    });

    gui.add(params, "ior", 1, 2.33, 0.01).onChange((val) => {
        shoeMat.ior = val;
    });

    gui.add(params, "reflectivity", 0, 1, 0.01).onChange((val) => {
        shoeMat.reflectivity = val;
    });

    gui.add(params, "thickness", 0, 5, 0.1).onChange((val) => {
        shoeMat.thickness = val;
    });


    gui.open();

}

function buildShaderMaterial() {

    //cubemap
    var path = './textures/JohwskaCube/';
    var format = '.png';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];


    refractionCube = new THREE.CubeTextureLoader().load(urls);
    refractionCube.mapping = THREE.CubeRefractionMapping;

    path = './textures/JohwskaHDRI/';
    format = '.png';
    urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var BG = new THREE.CubeTextureLoader().load(urls);

    scene.background = BG;

    const texture = new THREE.TextureLoader().load('textures/noiseGradient_Tile.png');
    const textureMask = new THREE.TextureLoader().load('textures/noiseGradientOP_Tile.png');

    const material = new THREE.MeshPhysicalMaterial({
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        ior: 1.5,
        reflectivity: 1.0,
        thickness: 5.0,
        envMap: refractionCube,
        envMapIntensity: 2.0,

    });

    material.onBeforeCompile = function (shader) {

        shader.uniforms.time = { value: 0 };
        shader.uniforms.emMap = { value: texture };
        shader.uniforms.opMap = { value: textureMask };
        shader.defines.USE_UV = '';
        shader.defines.USE_ENV = '';

        shader.fragmentShader = fragVars + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <output_fragment>',
            fragOutMod
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <transmission_fragment>',
            fragTransmissionMod
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <lights_fragment_maps>',
            fragLightMapMod
        );

        material.userData.shader = shader;

    };



    return material;

}


async function init() {

    const container = document.getElementById('container');

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const aspect = width / height;
    const devicePixelRatio = window.devicePixelRatio || 1;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(width, height);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = Math.pow(1, 4.0);
    document.body.appendChild(renderer.domElement);
    speedVal = params.speed;
    stats = new Stats();
    container.appendChild(stats.dom);

    cameraP = new THREE.PerspectiveCamera(65, aspect, 1, 10);
    cameraP.position.z = 2;
    cameraP.position.z = 2;
    cameraP.near = 0.00000001;


    scene = new THREE.Scene();

    light = new THREE.PointLight(0xddffdd, 1.0);
    light.position.z = 0;
    light.position.y = 10;
    light.position.x = 0;
    scene.add(light);


    light3 = new THREE.PointLight(0xddddff, 1.0);
    light3.position.z = 0;
    light3.position.y = 25;
    light3.position.x = 25;

    scene.add(light3);

    //cubemap
    var path = './textures/JohwskaCube/';
    var format = '.png';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];

    reflectionCube = new THREE.CubeTextureLoader().load(urls);
    const gltfLoader = new GLTFLoader().setPath('models/GLB/');
    const [model] = await Promise.all([

        gltfLoader.loadAsync('TopCoatv6_Web_FinalBlack.glb'),
    ]);

    model.scene.traverse(function (child) {
        if (child.isMesh && child.name == "Blob") {
            child.material = buildShaderMaterial();
            shoeMat = child.material;
            shoeMesh = child;
        } else if (child.isMesh) {

            var mat = child.material;
            mat.envMap = reflectionCube;
            mat.envMapIntensity = 5;

        }
    });
    model.scene.scale.multiplyScalar(15);
    model.scene.position.y = -1;

    scene.add(model.scene);

    const controls = new OrbitControls(cameraP, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 0;
    controls.maxDistance = 10;


    window.addEventListener('resize', onWindowResize);


    animate();

    clearGui();

}

function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    cameraP.aspect = aspect;
    cameraP.updateProjectionMatrix();

    renderer.setSize(width, height);


}

function animate() {

    requestAnimationFrame(animate);

    stats.begin();

    cameraP.updateMatrixWorld(true);


    renderer.render(scene, cameraP);

    if (shoeMesh.isMesh) {

        const shader = shoeMesh.material.userData.shader;
        if (shader) {

            shader.uniforms.time.value = performance.now() / (500 * (2 - speedVal));
        }
    }

    stats.end();

}