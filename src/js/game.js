import * as THREE from '../build/three.module.js';
import Stats from '../examples/jsm/libs/stats.module.js';
import { GLTFLoader } from '../examples/jsm/loaders/GLTFLoader.js';
import { Octree } from '../examples/jsm/math/Octree.js';
import { Capsule } from '../examples/jsm/math/Capsule.js';

// Default playerData
let playerData = {
    position: {'x':0, 'y':0, 'z':0},
    rotation: 0
}

// A manager for the loading screen
var manager = new THREE.LoadingManager();

/**
 * Edits the loading bar's contents
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {string} item The loaded item
 * @param   {number} loaded The number of items loaded
 * @param   {number} total The total number of items to load
 * @returns {void}
 * @version 1.1
 */
manager.onProgress = function ( item, loaded, total ) {
  document.getElementsByClassName('loading-item')[0].innerText = `${(loaded % 2 === 1) ? 'Loading' : 'Loaded'} ${(item.length > 53) ? item.slice(0,50)+'...' : item} | ${Math.round((loaded / total * 100)*1000)/1000}%`; 
  globalHandler.log(document.getElementsByClassName('loading-item')[0].innerText, "Loader")
  document.getElementsByClassName('loading-inner-bar')[0].style.width = ((loaded / total * 100)*0.8+((connectedToServer) ? 20 : 0))*0.98  + '%'; // *0.98 for styling and *0.8 as 20% of the bar is for networking.
  if (loaded === total) {
      setTimeout(() => {
        document.getElementById('loader').innerHTML = `<button class="btn btn-dark" onclick="joinGame();">Join Game</button>`;
            for (let i=0; i<5; i++) {
                const innerHMTL = `	<tr>
                <td>47</td>
                <td>
                    <img src="./assets/author.png">
                    <img src="./assets/author.png">
                    s3ansh33p
                </td>
                <td>12</td>
                <td>7</td>
                <td>3</td>
                <td>27</td>
            </tr>
            <tr class="spacer"></tr>`;
            document.getElementsByClassName('tab-players')[0].innerHTML += innerHMTL;
            document.getElementsByClassName('tab-players')[1].innerHTML += innerHMTL;
            }
        },300)
    }
};

const playerPrecision = 100;

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccff );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const ambientlight = new THREE.AmbientLight( 0x6688cc );
scene.add( ambientlight );

const fillLight1 = new THREE.DirectionalLight( 0xff9999, 0.5 );
fillLight1.position.set( - 1, 1, 2 );
scene.add( fillLight1 );

const fillLight2 = new THREE.DirectionalLight( 0x8888ff, 0.2 );
fillLight2.position.set( 0, - 1, 0 );
scene.add( fillLight2 );

const directionalLight = new THREE.DirectionalLight( 0xffffaa, 1.2 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById( 'container' );

container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild( stats.domElement );

const GRAVITY = 30;

const NUM_SPHERES = 20;
const SPHERE_RADIUS = 0.2;

const sphereGeometry = new THREE.SphereGeometry( SPHERE_RADIUS, 32, 32 );
const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x888855, roughness: 0.8, metalness: 0.5 } );

const spheres = [];
let sphereIdx = 0;

for ( let i = 0; i < NUM_SPHERES; i ++ ) {

    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    scene.add( sphere );

    spheres.push( { mesh: sphere, collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ), velocity: new THREE.Vector3() } );

}

const worldOctree = new Octree();

// T Spawn
const playerCollider = new Capsule( new THREE.Vector3( -15, 4.35, 35 ), new THREE.Vector3( -15, 5, 35 ), 0.35 );
camera.lookAt(-1, 0, -28);
// CT Spawn
// const playerCollider = new Capsule( new THREE.Vector3( 5, -1, -28 ), new THREE.Vector3( 5, -0.35, -28 ), 0.35 );
// camera.lookAt(-1, 0, 35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;

const keyStates = {};

document.addEventListener( 'keydown', ( event ) => {

    keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

    keyStates[ event.code ] = false;

} );

document.addEventListener( 'mousedown', () => {

    if (inGame && !typing) document.body.requestPointerLock();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

    if ( document.pointerLockElement === document.body && inGame && !typing) {

        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;

    }

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

document.addEventListener( 'click', () => {

    if (inGame && !typing) {

        const sphere = spheres[ sphereIdx ];

        camera.getWorldDirection( playerDirection );

        sphere.collider.center.copy( playerCollider.end );
        sphere.velocity.copy( playerDirection ).multiplyScalar( 30 );

        sphereIdx = ( sphereIdx + 1 ) % spheres.length;

    }

} );

/**
 * Player collision handler
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function playerCollisions() {

    const result = worldOctree.capsuleIntersect( playerCollider );

    playerOnFloor = false;

    if ( result ) {

        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

    }

}

/**
 * Update the player's camera and position
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function updatePlayer( deltaTime ) {

    if ( playerOnFloor ) {

        const damping = Math.exp( - 3 * deltaTime ) - 1;
        playerVelocity.addScaledVector( playerVelocity, damping );

    } else {

        playerVelocity.y -= GRAVITY * deltaTime;

    }

    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    playerCollisions();

    camera.position.copy( playerCollider.end );

}

/**
 * Sphere collision handler
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function spheresCollisions() {

    for ( let i = 0; i < spheres.length; i ++ ) {

        const s1 = spheres[ i ];

        for ( let j = i + 1; j < spheres.length; j ++ ) {

            const s2 = spheres[ j ];

            const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;

            if ( d2 < r2 ) {

                const normal = s1.collider.clone().center.sub( s2.collider.center ).normalize();
                const v1 = normal.clone().multiplyScalar( normal.dot( s1.velocity ) );
                const v2 = normal.clone().multiplyScalar( normal.dot( s2.velocity ) );
                s1.velocity.add( v2 ).sub( v1 );
                s2.velocity.add( v1 ).sub( v2 );

                const d = ( r - Math.sqrt( d2 ) ) / 2;

                s1.collider.center.addScaledVector( normal, d );
                s2.collider.center.addScaledVector( normal, - d );

            }

        }

    }

}

/**
 * Create and destroy spheres
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function updateSpheres( deltaTime ) {

    spheres.forEach( sphere =>{

        sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );

        const result = worldOctree.sphereIntersect( sphere.collider );

        if ( result ) {

            sphere.velocity.addScaledVector( result.normal, - result.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( result.normal.multiplyScalar( result.depth ) );

        } else {

            sphere.velocity.y -= GRAVITY * deltaTime;

        }

        const damping = Math.exp( - 1.5 * deltaTime ) - 1;
        sphere.velocity.addScaledVector( sphere.velocity, damping );

        spheresCollisions();

        sphere.mesh.position.copy( sphere.collider.center );

    } );

}

/**
 * Gets the forward player direction
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function getForwardVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

/**
 * Gets the side player direction
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function getSideVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

/**
 * Update player info based on controls
 * @author  https://github.com/mrdoob/three.js
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {number} deltaTime Miliseonds elapsed sice last frame
 * @returns {void}
 * @version 1.0
 */
function controls( deltaTime ) {

    const speed = 30;

    if ( playerOnFloor && !typing && inGame) {

        if ( keyStates[ 'KeyW' ] ) {
            playerVelocity.add( getForwardVector().multiplyScalar( speed * deltaTime ) );
        }

        if ( keyStates[ 'KeyS' ] ) {
            playerVelocity.add( getForwardVector().multiplyScalar( - speed * deltaTime ) );
        }

        if ( keyStates[ 'KeyA' ] ) {
            playerVelocity.add( getSideVector().multiplyScalar( - speed * deltaTime ) );
        }

        if ( keyStates[ 'KeyD' ] ) {
            playerVelocity.add( getSideVector().multiplyScalar( speed * deltaTime ) );
        }

        if ( keyStates[ 'Space' ] ) {
            playerVelocity.y = 11;
        }

    }

}

const loader = new GLTFLoader(manager).setPath( './assets/models/' );

let AK = 0;
loader.load( 'gun.glb', ( gltf ) => {

    AK = gltf.scene;
    scene.add( AK );
    AK.position.set(3,1,4);
    AK.scale.set(0.08,0.08,0.08);

} );

let playerModel = 0; // could be just 'let playerModel;'
let mixer; // Getting a basic animation working
let animations;
loader.load( 'basicperson.glb', ( gltf ) => {

    playerModel = gltf.scene;
    scene.add( playerModel );
    playerModel.position.set(-5,2,36);
    playerModel.scale.set(0.06,0.06,0.06);
    
    mixer = new THREE.AnimationMixer(playerModel);
    animations = gltf.animations;
} );

// callable from the main console with globalHandlers.play()
function playAnim() {
    mixer.clipAction(animations[0]).play()
}

// callable from the main console with globalHandlers.stop()
function pauseAnim() {
    mixer.clipAction(animations[0]).stop()
}

loader.load( 'scene.glb', ( gltf ) => {

    scene.add( gltf.scene );

    worldOctree.fromGraphNode( gltf.scene );

    gltf.scene.traverse( child => {

        if ( child.isMesh ) {

            // Added custom objects with the Material "CollisionBox.0xx" to act as collision borders to prevent players escaping the map.
            if ( child.name.slice(0,12) === "CollisionBox" ) {

                child.visible = false;

            } else {

                child.castShadow = true;
                child.receiveShadow = true;

                if ( child.material.map ) {

                    child.material.map.anisotropy = 8;

                }

            }

        }

    } );

    animate();

} );

// Testing Cube
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
const cube = new THREE.Mesh( geometry, material );
const cube2 = new THREE.Mesh( geometry, material );
scene.add( cube );
scene.add( cube2 );

/**
 * Transfers data to the server and renders entities
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function transferData() {
    // Render received data
    if (!connectedToServer) return;
    let cubes = [cube, cube2]
    for (let i=0; i<otherPlayers.length; i++) {
        
        cubes[i].position.set(otherPlayers[i].x || 0, otherPlayers[i].y || 0, otherPlayers[i].z || 0);
        cubes[i].rotation.set( 0, THREE.Math.degToRad(otherPlayers[i].rotation), 0);
    }

    // Send client packets to the server
    camera.getWorldDirection(playerDirection);
    if (Math.round(camera.position.x*playerPrecision)/playerPrecision != playerData.position.x || Math.round(camera.position.y*playerPrecision)/playerPrecision != playerData.position.y || Math.round(camera.position.z*playerPrecision)/playerPrecision != playerData.position.z || Math.round(THREE.Math.radToDeg( Math.atan2(playerDirection.x,playerDirection.z) )*playerPrecision)/playerPrecision != playerData.rotation) {
        playerData.position = {
            'x': Math.round(camera.position.x*playerPrecision)/playerPrecision,
            'y': Math.round(camera.position.y*playerPrecision)/playerPrecision,
            'z': Math.round(camera.position.z*playerPrecision)/playerPrecision
        }
        const camRotation = THREE.Math.radToDeg( Math.atan2(playerDirection.x,playerDirection.z) );
        playerData.rotation = Math.round(camRotation*playerPrecision)/playerPrecision;
        if (AK != 0) {
            AK.position.set(camera.position.x+Math.sin(THREE.Math.degToRad(camRotation))*0.5,
                            camera.position.y-0.2,
                            camera.position.z+Math.cos(THREE.Math.degToRad(camRotation))*0.5
                            );
            AK.rotation.set(0, THREE.Math.degToRad(270+camRotation), 0)
        }

        document.getElementById('debug').innerHTML = `Player X: ${playerData.position.x}, Y: ${playerData.position.y}, Z: ${playerData.position.z} | Deg: ${playerData.rotation}<br>Gun X: ${AK.position.x}, Y: ${AK.position.y}, Z: ${AK.position.z}`;
        sendData({
            'data':{
                'x':playerData.position.x || 0,
                'y':playerData.position.y || 0,
                'z':playerData.position.z || 0,
                'rotation': playerData.rotation,
                'hasFlag':false
            },
            'type': 'playerUpdate'
        })
    }
}

/**
 * Frame handler
 * @author  https://github.com/mrdoob/three.js
 * @returns {void}
 * @version 1.0
 */
function animate() {

    if (!inGame) return;

    const deltaTime = Math.min( 0.1, clock.getDelta() );

    controls( deltaTime );
    
    updatePlayer( deltaTime );
    
    updateSpheres( deltaTime );

    renderer.render( scene, camera );

    stats.update();

    transferData()

    if ( mixer ) {

        mixer.update( deltaTime );

    }

    requestAnimationFrame( animate );

}

window.globalHandler = window.globalHandler || {};
globalHandler.animate = () => animate();
globalHandler.play = () => playAnim();
globalHandler.stop = () => pauseAnim();

/**
 * Send a log event to the console with styling
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @param   {string} content The text shown in the log
 * @param   {string} title The title / category of the log
 * @returns {void}
 * @version 1.0
 */
globalHandler.log = (content, title="System") => {
    console.log(
        `%c[${title}]%c ${content}`,
        "color: #fff000;",""
    );
}