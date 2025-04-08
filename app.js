    /**********************Matter.js setup***********************/
    /***********************************************************/
    
    const { Engine, Render, Runner, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create();
    const { world } = engine;
    engine.world.gravity.y = 0; // Disable gravity
    const STATIC_CATEGORY = 0x0001; // Define collision categories
    const DYNAMIC_CATEGORY = 0x0002; // Define collision categories




    /**********************Key inputs****************************/
    /***********************************************************/
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    const activeKeys = new Set();
  
    window.addEventListener('keydown', (event) => {
      
      if (keys.hasOwnProperty(event.key) && !activeKeys.has(event.key)) {
          keys[event.key] = true;
          activeKeys.add(event.key);
          event.preventDefault();
      }
  });
  
  window.addEventListener('keyup', (event) => {
      if (keys.hasOwnProperty(event.key)) {
          keys[event.key] = false;
          activeKeys.delete(event.key);
          event.preventDefault();
      }
  });
  
  window.addEventListener('blur', () => {
      for (const key in keys) {
          keys[key] = false;
      }
      activeKeys.clear();
  });
  



    /**********************RENDERER******************************/
    /***********************************************************/
    
    // Create a renderer
    const canvas = document.getElementById('canvas');
    const render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        wireframes: false,
        background: '#ecf0f1'
      }
    });

    document.getElementById('canvas-container').addEventListener('click', () => {
      canvas.focus();
    });

    window.addEventListener('load', () => {
      canvas.focus();
    });

    canvas.setAttribute('tabindex', '0');
    canvas.style.outline = 'none';


    /**********************GAME OBJECTS**************************/
    /***********************************************************/   

    let SPEED = 0.5; // Acceleration/deceleration speed
    let TURN_SPEED = 0.05; // Steering speed
    const MIN_TURN_SPEED = 10;         // Speed below which turning is reduced (pixels/frame)
    const car = Bodies.rectangle(400, 300, 80, 40, {
        isStatic: false,
        density: 0.08,
        friction: 0.3,
        frictionAir: 0.1,
        angle: -Math.PI / 2,
        render: {
            fillStyle: 'blue'
        },
        collisionFilter: {
            category: DYNAMIC_CATEGORY,
            mask: STATIC_CATEGORY // Can only collide with static bodies
        }
    });
    
    // Add the car to the world
    World.add(world, car);
    
    // Create road sides (rectangles)
    let roadSides = [];
    
    // Add road sides to the world
    World.add(world, roadSides);


  function resetcarPosition() {
    Body.setPosition(car, { x: 400, y: 300 });
    Body.setAngle(car, -Math.PI / 2);
    Body.setVelocity(car, { x: 0, y: 0 });
    Body.setAngularVelocity(car, 0);
  }
    

    // Update car movement
    Events.on(engine, 'beforeUpdate', () => {
      // Acceleration and deceleration
      if (keys.ArrowUp) {
        Body.setVelocity(car, {
          x: Math.cos(car.angle) * SPEED * 10,
          y: Math.sin(car.angle) * SPEED * 10
        });
      }

      if (keys.ArrowDown) {
        Body.setVelocity(car, {
          x: -Math.cos(car.angle) * SPEED * 10,
          y: -Math.sin(car.angle) * SPEED * 10
        });
      }

      const currentSpeed = Body.getSpeed(car);
      
      if (currentSpeed > 0.1 && (keys.ArrowLeft || keys.ArrowRight)) {

        let targetTurnRate = 0;
        if (keys.ArrowLeft) {
          targetTurnRate = -TURN_SPEED;
        } else {
          targetTurnRate = TURN_SPEED;
        }
      
        const speedFactor = Math.min(1, currentSpeed /MIN_TURN_SPEED);
        targetTurnRate *= speedFactor;
        Body.setAngularVelocity(car,targetTurnRate);
      } else {
        Body.setAngularVelocity(car, 0);
      }
      
    });

    // Run the engine
    Engine.run(engine);

    // Run the renderer
    Render.run(render);



/*********************Camera and Raycasting******************/
/***********************************************************/

let NUM_RAYS = 5;
let ANGLE_OFFSET = Math.PI / 6; 
const RAY_LENGTH = 300;
function performRaycastingAndDraw(RAY_LENGTH = 300) {
    const carAngle = car.angle;
    const frontOffset = 10;
    const frontX = car.position.x + Math.cos(carAngle) * frontOffset;
    const frontY = car.position.y + Math.sin(carAngle) * frontOffset;
    
    let rayAngle = carAngle;
    let tmp = 1;
    
    for (let i = 0; i < NUM_RAYS; i++) {
        
        rayAngle = rayAngle  + (i * ANGLE_OFFSET) * tmp;
        tmp = -tmp;
        const start = { x: frontX, y: frontY };
        const end = {
            x: start.x + Math.cos(rayAngle) * RAY_LENGTH,
            y: start.y + Math.sin(rayAngle) * RAY_LENGTH
        };


        
        const staticBodies = roadSides;
        let closestHitPoint = end;
        let closestDistance = RAY_LENGTH;

        
        for(const body of roadSides){
            const vertices = body.vertices;
            
            for (let j = 0; j < vertices.length; j++) {
                const v1 = vertices[j];
                const v2 = vertices[(j + 1) % vertices.length];

                const hit = getRaySegmentIntersection(start, end, v1, v2);
                
                if (hit) {
                    const dx = hit.x - start.x;
                    const dy = hit.y - start.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestHitPoint = hit;
                    }
                }
            }
            if(closestDistance<RAY_LENGTH){
                break;  // Stop checking other bodies !!!!!!!!!
            }
        };

        const ctx = render.context;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x - render.bounds.min.x, start.y - render.bounds.min.y);
        ctx.lineTo(closestHitPoint.x - render.bounds.min.x, closestHitPoint.y - render.bounds.min.y);
        ctx.stroke();
    }
}

// Function to compute exact intersection point between a ray and a line segment
function getRaySegmentIntersection(rayStart, rayEnd, segStart, segEnd) {
    const x1 = rayStart.x, y1 = rayStart.y;
    const x2 = rayEnd.x, y2 = rayEnd.y;
    const x3 = segStart.x, y3 = segStart.y;
    const x4 = segEnd.x, y4 = segEnd.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (denom === 0) return null; // Parallel lines, no intersection

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    return null; // No valid intersection
}

// Center the camera on the car
Events.on(render, 'afterRender', () => {
    const centerX = car.position.x - render.options.width / 2;
    const centerY = car.position.y - render.options.height / 2;

    // Update the render bounds to follow the car
    render.bounds.min.x = centerX;
    render.bounds.min.y = centerY;
    render.bounds.max.x = centerX + render.options.width;
    render.bounds.max.y = centerY + render.options.height;

    // Move the camera
    Render.lookAt(render, {
        min: { x: centerX, y: centerY },
        max: { x: centerX + render.options.width, y: centerY + render.options.height }
    });
    performRaycastingAndDraw();
});

// Handle window resizing
window.addEventListener('resize', () => {
    render.canvas.width = canvas.clientWidth;
    render.canvas.height = canvas.clientHeight;
    const centerX = car.position.x - render.options.width / 2;
    const centerY = car.position.y - render.options.height / 2;
    Render.lookAt(render, {
        min: { x: centerX, y: centerY },
        max: { x: centerX + render.options.width, y: centerY + render.options.height }
    });
  });








/**********************Adding Roadss*************************/
/***********************************************************/
let length = 0;
let angle = 0;
let isDragging = false;
let startPos = null;
let currentRoad = null;
let previousRoad = null;
const ROAD_WIDTH = 20; // Fixed width of the road side

// Mouse events for click-and-drag
render.canvas.addEventListener('mousedown', (event) => {

    isDragging = true;
    startPos = { x: render.bounds.min.x + event.offsetX, y: render.bounds.min.y + event.offsetY };
});

render.canvas.addEventListener('mousemove', (event) => {
    if (isDragging && startPos) {
        const endPos = { x: render.bounds.min.x + event.offsetX, y: render.bounds.min.y + event.offsetY };

        // Calculate the center of the road side
        const centerX = (startPos.x + endPos.x) / 2;
        const centerY = (startPos.y + endPos.y) / 2;

        // Calculate the length and angle of the road side
        length = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
        );
        angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);

        // Remove the previous road side (if any)
        if (currentRoad) {
            World.remove(world, currentRoad);
        }

        // Create a new road side
        currentRoad = Bodies.rectangle(centerX, centerY, length, ROAD_WIDTH, {
            isStatic: true,
            angle: angle, // Rotate the road side to align with the drag line
            render: {
                fillStyle: 'gray'
            },
            collisionFilter: {
                category: STATIC_CATEGORY,
                mask: DYNAMIC_CATEGORY // Can only collide with dynamic bodies
            }
        });
        currentRoad.realLength = length;

        // Add the road side to the world (temporarily)
        World.add(world, currentRoad);
    }
});

render.canvas.addEventListener('mouseup', () => {
    if (isDragging && currentRoad) {
        if(length<50){
            World.remove(world, currentRoad);
        }else{
            roadSides.push(currentRoad);
        }
        // Finalize the road side
        isDragging = false;
        startPos = null;
        currentRoad = null;
    }
});


render.canvas.addEventListener('mouseout', () => {
    if (isDragging && currentRoad) {
        if(length<50){
            World.remove(world, currentRoad);
        }else{
            roadSides.push(currentRoad);
        }
        // Finalize the road side
        isDragging = false;
        startPos = null;
        currentRoad = null;
    }
});




/**************************CONTROLS**************************/
/***********************************************************/



const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
speedSlider.addEventListener('input', () => {
  SPEED = parseFloat(speedSlider.value);
  speedValue.textContent = SPEED;
});


// Turn Speed Slider
const turnSpeedSlider = document.getElementById('turn-speed');
const turnSpeedValue = document.getElementById('turn-speed-value');
turnSpeedSlider.addEventListener('input', () => {
  TURN_SPEED = parseFloat(turnSpeedSlider.value);
  turnSpeedValue.textContent = TURN_SPEED;
});

// Friction Slider
const frictionSlider = document.getElementById('friction');
const frictionValue = document.getElementById('friction-value');
frictionSlider.addEventListener('input', () => {
  const FRICTION = parseFloat(frictionSlider.value);
  frictionValue.textContent = FRICTION;
  // Update friction for all bodies (example)
  car.frictionAir = FRICTION;
});



// Number of Rays Slider
const numRaysSlider = document.getElementById('num-rays');
const numRaysValue = document.getElementById('num-rays-value');
numRaysSlider.addEventListener('input', () => {
  NUM_RAYS = parseInt(numRaysSlider.value);
  numRaysSlider.value = NUM_RAYS;
  numRaysValue.textContent = NUM_RAYS;
  // Update spacing based on new number of rays
  ANGLE_OFFSET = Math.PI / (NUM_RAYS + 1);
  const valueInDegrees = Math.ceil( ANGLE_OFFSET * 180 / Math.PI )
  raySpacingSlider.value = valueInDegrees;
  raySpacingValue.textContent = valueInDegrees;
});

// Ray Spacing Slider
const raySpacingSlider = document.getElementById('ray-spacing');
const raySpacingValue = document.getElementById('ray-spacing-value');
raySpacingSlider.addEventListener('input', () => {
  const newValue = raySpacingSlider.value;
  ANGLE_OFFSET = parseInt(newValue) * Math.PI / 180;
  raySpacingSlider.value = newValue;
  raySpacingValue.textContent = newValue;
});



/**************************Json**************************/
/***********************************************************/


function getTrackData(trackId) {
  const scriptElement = document.getElementById(trackId);
  if (scriptElement) {
    return JSON.parse(scriptElement.textContent);
  }
  alert('Track data not found!');
  return [];
}


function loadTrack(JsonData){
  World.remove(world, roadSides);
  resetcarPosition();

  roadSides = JsonData.map(data =>{
    let side = Bodies.rectangle(data.position.x, data.position.y, data.length,ROAD_WIDTH, {
      isStatic: true,
      angle: data.angle,
      collisionFilter: {
        category: STATIC_CATEGORY,
        mask: DYNAMIC_CATEGORY
      },
      render: {
        fillStyle: 'gray'
      }
    })
    side.realLength = data.length;
    return side;
  }
  );
  World.add(world, roadSides);
  console.log('Track with '+ roadSides.length +' sides loaded successfully!');
}

const trackList = document.getElementById('choose-track');
trackList.addEventListener('change', async (event) => {
  const trackName = event.target.value;
  if (trackName === 'custom') {return;}
  loadTrack(getTrackData(trackName));
  canvas.click();
  canvas.focus();
});
loadTrack(getTrackData("track"));
trackList.value = 'track';



// Flash Back Button
document.getElementById('flash-back').addEventListener('click', () => {
  if(!isDragging){
    World.remove(world, roadSides.pop());
  }
  canvas.focus();
});

// Save Track Button
document.getElementById('save-track').addEventListener('click', () => {
  const roadData = roadSides.map(side => {
    return ({ 
      position: { x: side.position.x, y: side.position.y },
      length: side.realLength,
      angle: side.angle
    });
  });
  const blob = new Blob([JSON.stringify(roadData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'track.json';
  a.click();
  URL.revokeObjectURL(url);
  canvas.focus();
});


document.getElementById('construct-track').addEventListener('click', () => {
  // Remove existing road sides
  World.remove(world, roadSides);
  resetcarPosition();
  roadSides = [];
  World.add(world, roadSides);

  loadTrack(getTrackData('track'));
  trackList.value = 'track';
  canvas.focus();
});




document.getElementById('load-track').addEventListener('click', () => {
  const input = document.getElementById('file-input');
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result); // Parse JSON
      loadTrack(data); // Use the parsed JSON data
    };
    reader.readAsText(file); // Read file as text
    trackList.value = 'custom';
    canvas.focus();
  }
});