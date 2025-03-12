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
  
      // Keydown event listener
      window.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.key)) {
          keys[event.key] = true;
        }
      });
  
      // Keyup event listener
      window.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.key)) {
          keys[event.key] = false;
        }
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


    /**********************GAME OBJECTS**************************/
    /***********************************************************/   

    const SPEED = 0.5; // Acceleration/deceleration speed
    const TURN_SPEED = 0.05; // Steering speed
    
    const car = Bodies.rectangle(400, 300, 80, 40, {
        isStatic: false,
        density: 0.08,
        friction: 0.3,
        frictionAir: 0.1,
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
    const roadSides = [
        // Left side
        Bodies.rectangle(200, 300, 20, 400, {
            isStatic: true,
            collisionFilter: {
                category: STATIC_CATEGORY,
                mask: DYNAMIC_CATEGORY // Can only collide with dynamic bodies
            },
            render: {
                fillStyle: 'gray'
            }
        }),
        // Right side
        Bodies.rectangle(600, 300, 20, 400, {
            isStatic: true,
            collisionFilter: {
                category: STATIC_CATEGORY,
                mask: DYNAMIC_CATEGORY // Can only collide with dynamic bodies
            },
            render: {
                fillStyle: 'gray'
            }
        })
    ];
    
    // Add road sides to the world
    World.add(world, roadSides);
    

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

      // Turning (only when left or right keys are pressed)
      if ((keys.ArrowUp || keys.ArrowDown) && keys.ArrowLeft) {
        Body.setAngularVelocity(car, -TURN_SPEED);
      } else if ((keys.ArrowUp || keys.ArrowDown) && keys.ArrowRight) {
        Body.setAngularVelocity(car, TURN_SPEED);
      } else {
        // Stop turning when no keys are pressed
        Body.setAngularVelocity(car, 0);
      }
    });

    // Run the engine
    Engine.run(engine);

    // Run the renderer
    Render.run(render);



/*********************Camera and Raycasting******************/
/***********************************************************/

function performRaycastingAndDraw(rayLength = 300) {
    const numRays = 5;
    const angleOffset = Math.PI / 6;
    const carAngle = car.angle;
    const frontOffset = 10;
    const frontX = car.position.x + Math.cos(carAngle) * frontOffset;
    const frontY = car.position.y + Math.sin(carAngle) * frontOffset;
    
    let rayAngle = carAngle;
    let tmp = 1;
    
    for (let i = 0; i < numRays; i++) {
        
        rayAngle = rayAngle  + (i * angleOffset) * tmp;
        tmp = -tmp;
        const start = { x: frontX, y: frontY };
        const end = {
            x: start.x + Math.cos(rayAngle) * rayLength,
            y: start.y + Math.sin(rayAngle) * rayLength
        };


        
        const staticBodies = roadSides;
        let closestHitPoint = end;
        let closestDistance = rayLength;

        
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
            if(closestDistance<rayLength){
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





