import * as THREE from '../build/three.module.js';
import Stats from '../examples/jsm/libs/stats.module.js';
import { GLTFLoader } from '../examples/jsm/loaders/GLTFLoader.js';
import { Octree } from '../examples/jsm/math/Octree.js';
import { Capsule } from '../examples/jsm/math/Capsule.js';
import { EffectComposer } from '../examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../examples/jsm/postprocessing/ShaderPass.js';
import { LuminosityShader } from '../examples/jsm/shaders/LuminosityShader.js';
import { SSAARenderPass } from '../examples/jsm/postprocessing/SSAARenderPass.js';
import { CopyShader } from '../examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from '../examples/jsm/shaders/FXAAShader.js';
// Default playerData
let playerData = {
    position: {'x':0, 'y':0, 'z':0},
    rotation: 0,
    health: 100
}

// A manager for the loading screen
var manager = new THREE.LoadingManager();

// Load in settings
let clientSettings = globalHandler.getSettings();

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
    if (document.getElementsByClassName('loading-item')[0] !== undefined) {
        document.getElementsByClassName('loading-item')[0].innerText = `${(loaded % 2 === 1) ? 'Loading' : 'Loaded'} ${(item.length > 53) ? item.slice(0,50)+'...' : item} | ${Math.round((loaded / total)*100000)/1000}%`; 
        globalHandler.log(document.getElementsByClassName('loading-item')[0].innerText, "Loader")
        document.getElementsByClassName('loading-inner-bar')[0].style.width = ((loaded / total*0.8)*100+((connectedToServer) ? 20 : 0))*0.98  + '%'; // *0.98 for styling and *0.8 as 20% of the bar is for networking
        if (loaded === total) {
            globalHandler.log("Loaded all models", "Loader");
            loadAudio();
        }
    }
};

const weaponData = [
    {
        'name': 'AK-47',
        'damage': {
            'head': 143,
            'chest': 44,
            'legs': 26
        }, 
        'price': 2700,
        'reward': 300,
        'penetration': 77.5,
        'rounds': { // 30/90 starting
            'max': 30,
            'extramags': 3
        }
    }
]

const playerPrecision = 100;

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccff );

const scene2 = new THREE.Scene();
scene2.background = new THREE.Color( 0xff7700 );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const raycaster = new THREE.Raycaster();

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

const listener = new THREE.AudioListener();
camera.add( listener );

const sound = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();
// Load Audio
let soundBuffers = [];
function loadAudio() {
    let loadedTotal = 0;
    let sounds = ['valve_csgo_01/mainmenu.mp3', 'valve_csgo_02/mainmenu.mp3', 'mainmenu.mp3'];
    for (let i=0;i<sounds.length;i++) {
        let item = `./assets/audio/music/${sounds[i]}`
        audioLoader.load( item, function( buffer ) {
            soundBuffers.push({
                "name": sounds[i],
                "buffer": buffer,
            })
        }, function ( xhr ) {
            globalHandler.log(`${item} | ${Math.round((xhr.loaded / xhr.total)*100000)/1000}%`, "Loader");
            if (xhr.loaded / xhr.total === 1) {
                loadedTotal++;
            }
            document.getElementsByClassName('loading-item')[0].innerText = `${(xhr.loaded / xhr.total !== 1) ? 'Loading' : 'Loaded'} ${(item.length > 53) ? item.slice(0,50)+'...' : item} | ${Math.round((xhr.loaded / xhr.total)*100000)/1000}%`; 
            document.getElementsByClassName('loading-inner-bar')[0].style.width = ((xhr.loaded / xhr.total))*98*(loadedTotal/sounds.length)  + '%'; // *0.98 for styling
            if (loadedTotal === 3) {
                setTimeout(() => {
                    document.getElementById('loader').innerHTML = `<button class="btn btn-dark" onclick="joinGame();">Join Game</button>`;
                },1000)
            }
        },

        // onError callback
        function ( err ) {
            console.log( err );
        });
    }
}

audioLoader.load( `./assets/audio/music/valve_csgo_02/mainmenu.mp3`, function( sb ) {
    sound.setBuffer( sb );
    sound.setLoop( false );
    sound.setVolume( 0.05 );
    sound.play();
});
// setTimeout(() => {
//     console.log(soundBuffers)
//     sound.stop();
//     sound.setBuffer( soundBuffers.find((x) => x.name == "valve_csgo_02/mainmenu.mp3").buffer );
//     sound.play();
// }, 6000);

const container = document.getElementById( 'container' );

container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
stats.domElement.id = 'statsContainer';
stats.showPanel(3);

container.appendChild( stats.domElement );

const GRAVITY = 30;

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

document.addEventListener( 'mousedown', (e) => {

    if (inGame && !typing && !pointerCheck(e)) document.body.requestPointerLock();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

    if ( document.pointerLockElement === document.body && inGame && !typing) {

        let mouseProps = globalHandler.getSettings().mouse;

        camera.rotation.y -= (event.movementX / ((101-mouseProps.sensitivity)*10))*(mouseProps.invert ? -1 : 1);
        camera.rotation.x -= (event.movementY / ((101-mouseProps.sensitivity)*10))*(mouseProps.invert ? -1 : 1);

    }

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// The default weapon should be an AK
let ammo = weaponData[0].rounds.max;
let mag = weaponData[0].rounds.max * weaponData[0].rounds.extramags;

// preload ammo in UI
document.getElementById('weapon-ammo').children[0].innerText = ammo;
document.getElementById('weapon-ammo').children[1].innerText = "/"+mag;

function updateAmmo() {
    if (ammo !== 0) {
        ammo--;
        let ammoContainer = document.getElementById('weapon-ammo').children;
        if (ammoContainer[0].innerText !== "0") {
            ammoContainer[0].innerText = ammo
        }
    }
}

function reloadAmmo() {
    if (mag !== 0) {
        let ammoContainer = document.getElementById('weapon-ammo').children;
        mag = mag - weaponData[0].rounds.max + ammo;
        if (mag < 0) mag = 0;
        ammo = weaponData[0].rounds.max;
        ammoContainer[0].innerText = ammo;            
        ammoContainer[1].innerText = "/" + mag;  
    }
}

function pointerCheck(e) {
    for (let i=0; i<e.path.length; i++) {
        if (e.path[i].id === "gameMenu-0") return false; // Return to game option
        if  (e.path[i].id === "menu" || e.path[i].id === "settings") return true;
    }
    return false;
}

let arrowHelpers = [];

document.addEventListener( 'click', (e) => {

    if (inGame && !typing && !pointerCheck(e) && ammo !== 0) {

        camera.getWorldDirection( playerDirection );

        raycaster.setFromCamera( {x:0, y:0}, camera );   
        raycaster.ray.direction.set(raycaster.ray.direction.x, raycaster.ray.direction.y); // Wierd bug to sort out.
        updateAmmo();

        let intersects = raycaster.intersectObjects( scene.children, true );

        for (let i = 0; i < arrowHelpers.length; i++) {
            scene.remove( arrowHelpers[i] );
        }

        arrowHelpers = [];
        
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.name.slice(0,12) === "CollisionBox") {
                // console.log(intersects[i].object.name);
            } else if (intersects[i].object.name === "Mesh") {
                // Get direction unit vector
                // Set point A to origin vector
                // Set point B to colission vector
                // Compare points with otherPlayers
                // Check for hits
                // console.log("PlayerModelID: ", intersects[i].object.parent.parent.id)
                const otherPlayerID = playerModels.map(e => e.id).indexOf(intersects[i].object.parent.parent.id);
                if (otherPlayerID !== -1) {
                    if (globalHandler.otherPlayers()[otherPlayerID] !== undefined) {
                        globalHandler.log("Collision with Player Mesh: " + JSON.stringify(intersects[i].point), "Damage"); 
                        globalHandler.log(globalHandler.otherPlayers()[otherPlayerID].client, "Damage");
                        sendData({
                            'data': {
                                'clientID': globalHandler.otherPlayers()[otherPlayerID].client
                            },
                            'type': 'damage'
                        })
                    } else {
                        globalHandler.log("Invalid playerID", "Damage")
                    }
                } else {
                    globalHandler.log("Invalid modelID", "Damage");
                }
            } else if (globalHandler.getSettings().rendering.arrowHelpers) {
                arrowHelpers.push(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, intersects[i].distance, 0xff0000));
                scene.add( arrowHelpers[arrowHelpers.length-1]);
            }
            /*
                An intersection has the following properties :
                    - object : intersected object (THREE.Mesh)
                    - distance : distance from camera to intersection (number)
                    - face : intersected face (THREE.Face3)
                    - faceIndex : intersected face index (number)
                    - point : intersection point (THREE.Vector3)
                    - uv : intersection point in the object's UV coordinates (THREE.Vector2)
            */
        }

    }

} );

// Wireframe toggle function
function enableWireframe(enabled = true) {

    scene.traverse( child => {

        if ( child.isMesh ) {

            // child.material.wireframe = enabled;
            
            if ( child.name === "Mesh" ) { // Other player 
                // console.log(child);
                child.material.wireframe = enabled;
            } else {
                child.material.transparent = enabled;
                child.material.opacity = 0.2;
            }

        }

    });

}

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

    const speed = (playerOnFloor) ? 20 : 2;

    if ( !typing && inGame && locked) {

        if ( keyStates[ globalHandler.getSettings().movement.forward ] ) {
            playerVelocity.add( getForwardVector().multiplyScalar( speed * deltaTime ) );
        }

        if ( keyStates[ globalHandler.getSettings().movement.backward ] ) {
            playerVelocity.add( getForwardVector().multiplyScalar( - speed * deltaTime ) );
        }

        if ( keyStates[ globalHandler.getSettings().movement.left ] ) {
            playerVelocity.add( getSideVector().multiplyScalar( - speed * deltaTime ) );
        }

        if ( keyStates[ globalHandler.getSettings().movement.right ] ) {
            playerVelocity.add( getSideVector().multiplyScalar( speed * deltaTime ) );
        }

        if ( playerOnFloor && keyStates[ globalHandler.getSettings().movement.jump ] ) {
            playerVelocity.y = 9;
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

let playerModels = [];
let playerModel;
let mixer; // Getting a basic animation working
let animations;

function loadPlayerModel() {
    loader.load( 'player_t.glb', ( gltf ) => {

        playerModel = gltf.scene;
        scene.add( playerModel );
        // playerModel.position.set(-5,2,36);
        playerModel.scale.set(0.06,0.06,0.06);
        
        mixer = new THREE.AnimationMixer(playerModel);
        animations = gltf.animations;

        playerModels.push(playerModel);
    } );
}

for (let i = 0; i < 10; i++) {
    loadPlayerModel();
}

// callable from the main console with globalHandler.play()
function playAnim() {
    mixer.clipAction(animations[0]).play()
}

// callable from the main console with globalHandler.stop()
function pauseAnim() {
    mixer.clipAction(animations[0]).stop()
}

let text;

function loadText() {
    const loader = new THREE.FontLoader();
    loader.load( 'assets/font.json', function ( font ) {

        const color = 0x006699;
        const message = "Hi\nThere";
        text = new THREE.Mesh( new THREE.ShapeGeometry(  font.generateShapes( message, 0.25 ) ), new THREE.LineBasicMaterial( { color: color, side: THREE.DoubleSide } ) );
        
        text.position.y = -10;
        scene.add( text );
        
    } );
}

// loadText();

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


// Movement
let curProps = Object.getOwnPropertyNames(clientSettings.movement);
for (let i=0; i<curProps.length; i++) {
    document.getElementById(`settings-movement-${i+1}`).value = clientSettings.movement[curProps[i]];
    
    // Create listeners
    document.getElementById(`settings-movement-${i+1}`).addEventListener("keydown", (e) => {
        curProps = Object.getOwnPropertyNames(clientSettings.movement);
        e.preventDefault();
        e.target.value = e.code;
        let id = curProps[e.target.id.slice(e.target.id.lastIndexOf('-')+1)-1];
        clientSettings.movement[id] = e.code;
        console.log(clientSettings)
        saveSettings(clientSettings);
    }); 
}
// Mouse
curProps = Object.getOwnPropertyNames(clientSettings.mouse);
// Invert Mouse
document.getElementById(`settings-mouse-1`).innerText = (clientSettings.mouse[curProps[1]]) ? 'Yes' : 'No' ;
// Mouse Sensitivty
document.getElementById(`settings-mouse-2`).value = (clientSettings.mouse[curProps[0]]);
    
// Create listeners for Mouse Sensitivity
document.getElementById(`settings-mouse-2`).addEventListener("change", (e) => {
    e.preventDefault();
    clientSettings.mouse.sensitivity = e.target.value;
    saveSettings(clientSettings);
}); 

// Create listeners for Crosshair
curProps = Object.getOwnPropertyNames(clientSettings.crosshair);
for (let i=0; i<3; i++) {
    // document.getElementById(`settings-crosshair-${i+1}`).value = 
    document.getElementById(`settings-crosshair-${i+1}`).addEventListener("change", (e) => {
        e.preventDefault();
        clientSettings.crosshair[curProps[i]] = e.target.value * ((e.target.id.slice(19) != 2) ? 0.5 : 2)
        renderCrosshair(clientSettings.crosshair.offset, clientSettings.crosshair.cLength, clientSettings.crosshair.cWidth)
        // console.log(clientSettings.crosshair)
        saveSettings(clientSettings);
    }); 
} 

/**
 * Transfers data to the server and renders entities
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.0
 */
function transferData() {
    // Render received data
    if (!connectedToServer) return;
    for (let i=0; i<otherPlayers.length; i++) {

        if (playerModels[i]) {
            playerModels[i].position.set(otherPlayers[i].x || 0, otherPlayers[i].y - 1 || 0, otherPlayers[i].z || 0);
            playerModels[i].rotation.set( 0, THREE.Math.degToRad(otherPlayers[i].rotation), 0);
        }
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

        // Render player text 
        if (text) {
            text.position.set(camera.position.x+Math.sin(THREE.Math.degToRad(camRotation))*0.5,
                camera.position.y-0.2,
                camera.position.z+Math.cos(THREE.Math.degToRad(camRotation))*0.5
            );
            text.rotation.set(0, THREE.Math.degToRad(180+camRotation), 0);
        }

        // document.getElementById('debug').innerHTML = `Player X: ${playerData.position.x}, Y: ${playerData.position.y}, Z: ${playerData.position.z} | Deg: ${playerData.rotation}<br>Gun X: ${AK.position.x}, Y: ${AK.position.y}, Z: ${AK.position.z}`;
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

function showStats(enabled = true) {
    const container = document.getElementById('statsContainer');
    for (let i = 0; i<container.childElementCount; i++) {
        container.children[i].style.display = (enabled) ? "block" : "none";
    }
}

// Post processing loader
const composer = new EffectComposer( renderer );
composer.setPixelRatio( 1 ); // ensure pixel ratio is always 1 for performance reasons

if (clientSettings.rendering.shaders) {

    composer.addPass( new RenderPass( scene, camera ) );

    if (clientSettings.rendering.fxaa) {

        composer.addPass( new ShaderPass( FXAAShader ) );
    
    }

    if (clientSettings.rendering.ssaa) {

        let ssaaRenderPass = new SSAARenderPass( scene, camera );
        ssaaRenderPass.sampleLevel = clientSettings.rendering.sampling;
        composer.addPass( ssaaRenderPass );

    }

    if (clientSettings.rendering.luminosity) {

        composer.addPass( new ShaderPass( LuminosityShader ) );

    }

    composer.addPass( new ShaderPass( CopyShader ) );

}


/**
 * Frame handler
 * @author  https://github.com/mrdoob/three.js
 * @author  Sean McGinty <newfolderlocation@gmail.com>
 * @returns {void}
 * @version 1.2
 */

function animate() {

    if (!inGame) return;

    const deltaTime = Math.min( 0.1, clock.getDelta() );
    
    if ( globalHandler.gameProps.state === 'end' ) {

        renderer.render( scene2, camera );

    } else {
        
        controls( deltaTime );
            
        updatePlayer( deltaTime );
            
        renderer.render( scene, camera );
        
        if ( mixer ) {
            
            mixer.update( deltaTime );
            
        }

        transferData();

    }
    
    stats.update();

    setTimeout( function() {

        requestAnimationFrame( animate );
        composer.render();

    }, 1/(globalHandler.getSettings().rendering.frameLimit === 60) ? 1 : globalHandler.getSettings().rendering.frameLimit*1000 );



}

/**
 * A globally accessable object for running functions
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @namespace   globalHandler
 * @version     1.1
 */
window.globalHandler = window.globalHandler || {};

/**
 * A variable in globalHandler (globalHandler.playerData)
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.playerData = playerData;

/**
 * A function in globalHandler (globalHandler.animate)
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.animate = () => animate();

/**
 * A function in globalHandler (globalHandler.play)
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.play = () => playAnim();

/**
 * A function in globalHandler (globalHandler.stop)
 * @author       Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.stop = () => pauseAnim();

/**
 * A function in globalHandler (globalHandler.showStats)
 * @author       Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.showStats = (enabled) => showStats(enabled);

/**
 * A function in globalHandler (globalHandler.loadPlayer)
 * @author       Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.loadPlayer = () => loadPlayerModel();

// Global access to player models.
globalHandler.playerModels = playerModels;

/**
 * An object to store the properties of the game
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @property    {object}  globalHandler.gameProps             Game properties store on the client side
 * @property    {'start'|'end'} globalHandler.gameProps.state The state of the game to determine what to render
 * @returns     {void}
 * @version     1.0
 */
globalHandler.gameProps = {
    'state': 'start'
};

/**
 * A function in globalHandler (globalHandler.log) 
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @param       {string} content The text shown in the log
 * @param       {string} title The title / category of the log
 * @returns     {void}
 * @version     1.1
 */
globalHandler.log = (content, title="System") => {
    console.log(
        `%c[${title}]%c ${content}`,
        "color: #fff000;",""
    );
}

/**
 * A function in globalHandler (globalHandler.log) 
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.1
 */
globalHandler.gameEndScreen = () => {
    globalHandler.log(`Transitioning to end game screen`);
    const transition = document.getElementById('scene-transition');
    transition.classList.add('active');
    setTimeout(() => {
        globalHandler.gameProps.state = 'end';
        scene.remove.apply(scene, scene.children); // Remove the main scene
    }, 1500);
}

/**
 * A function in globalHandler (globalHandler.reload) 
 * @author      Sean McGinty <newfolderlocation@gmail.com>
 * @method
 * @returns     {void}
 * @version     1.0
 */
globalHandler.reload = () => reloadAmmo();
addKeyBind(() => {globalHandler.reload()}, clientSettings.game.reload);

// Testing functions
globalHandler.wireframe = (enabled) => enableWireframe(enabled);
