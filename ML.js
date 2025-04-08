//<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest"></script>
function createModel(inputShape,hiddenShape,outputShape) {
    const model = tf.sequential();
  
    // Input layer
    model.add(tf.layers.dense({
      units: hiddenShape, // Hidden layer with 4 neurons
      inputShape: [inputShape], // input features (beam distances,etc...)
      activation: 'sigmoid' // Sigmoid activation
    }));
  
    // Output layer
    model.add(tf.layers.dense({
      units: outputShape, // output actions (left, straight, right,down, etc...),
      activation: 'softmax' // Softmax for probability distribution
    }));
  
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.1), // Adam optimizer with learning rate 0.1
      loss: 'categoricalCrossentropy', // Loss function for classification
      metrics: ['accuracy']
    });
  
    return model;
  }
  
  const model = createModel(5,5,2);


  function decideAction(beamDistances) {
    // Convert beam distances to a TensorFlow tensor
    const input = tf.tensor2d([beamDistances]);
    // Predict the output
    const output = model.predict(input);
    // Get the action with the highest probability
    const actionIndex = output.argMax(1).dataSync()[0];
    // Clean up tensors
    input.dispose();
    output.dispose();
  
    //return ['left', 'straight', 'right'][actionIndex];
    return actionIndex;
}


  async function trainModel(beamDistances, targetOutput) {
    // Convert inputs and targets to tensors
    const inputs = tf.tensor2d([beamDistances]);
    const targets = tf.tensor2d([targetOutput]);
  
    // Train the model
    await model.fit(inputs, targets, {
      epochs: 1, // Train for 1 epoch
      shuffle: true,
      verbose: 0 // Disable logging
    });
  
    // Clean up tensors
    inputs.dispose();
    targets.dispose();
  }


  async function update() {
    const beamDistances = castBeams(car); // Get beam distances
    const action = decideAction(beamDistances); // Decide action
    moveCar(car, action); // Move the car
  
    // Train the model based on performance
    if (carIsOnTrack()) {
      const targetOutput = [0, 1, 0]; // Reward for going straight
      await trainModel(beamDistances, targetOutput);
    } else {
      const targetOutput = [1, 0, 0]; // Penalty for going off-track
      await trainModel(beamDistances, targetOutput);
      resetCar();
    }
  
    requestAnimationFrame(update);
  }
  
  update();