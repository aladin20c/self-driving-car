//

function createModel(inputShape,hiddenShape,outputShape) {
    const model = tf.sequential();
  
    // Input layer
    model.add(tf.layers.dense({
      units: hiddenShape, // Hidden layer with 4 neurons
      inputShape: [inputShape], // input features (beam distances,etc...)
      activation: 'sigmoid' // Sigmoid activation
    }));
    
    //model.add(tf.layers.dropout({rate: 0.2}));

    // Output layer
    model.add(tf.layers.dense({
      units: outputShape, // output actions (left, straight, right,down, etc...),
      activation: 'softmax' // Softmax for probability distribution
    }));
  
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.01), // Adam optimizer with learning rate 0.1
      loss: 'categoricalCrossentropy', // Loss function for classification
      metrics: ['accuracy']
    });
  
    return model;
  }








  

  /*

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
  
    //return ['left', 'right'][actionIndex];
    return actionIndex;
}*/


  /*async function trainModel(beamDistances, targetOutput) {
    const inputs = tf.tensor2d([beamDistances]);
    const targets = tf.tensor2d([targetOutput]);
      await model.fit(inputs, targets, {
      epochs: 1, // Train for 1 epoch
      shuffle: true,
      verbose: 0 // Disable logging
    });
    inputs.dispose();
    targets.dispose();
  }*/
/*
    async function trainModel(beamDistances, targetOutput, reward) {
      // Convert inputs and targets to tensors
      const inputs = tf.tensor2d([beamDistances]);
      const targets = tf.tensor2d([targetOutput]);
      
      // Dynamic learning rate based on reward
      const effectiveLearningRate = 0.001 * (1 + reward); 
      model.optimizer.setLearningRate(effectiveLearningRate);
      
      // Train with more epochs for significant events
      const epochs = Math.min(3, Math.max(1, Math.abs(reward)));
      
      await model.fit(inputs, targets, {
          epochs: epochs,
          shuffle: true,
          verbose: 0
      });
      
      inputs.dispose();
      targets.dispose();
    }*/

      function trainModel(beamDistances, actionIndex, reward) {
        const inputs = tf.tensor2d([beamDistances]);
      
        // Create a one-hot target with higher confidence for the action taken
        const targetArray = [0, 0, 0];
        targetArray[actionIndex] = 1; // reinforce chosen action
      
        const targets = tf.tensor2d([targetArray]);
      
        //const effectiveLearningRate = 0.001 * (1 + reward); 
        //model.optimizer.setLearningRate(effectiveLearningRate);
      
        const epochs = Math.min(3, Math.max(1, Math.floor(Math.abs(reward) * 5)));
      
        model.fit(inputs, targets, {
          epochs,
          shuffle: true,
          verbose: 0
        });
      
        inputs.dispose();
        targets.dispose();
      }


    function decideAction(beamDistances, explorationRate = 0.1) {
      const input = tf.tensor2d([beamDistances]);
      const output = model.predict(input);
      const probs = output.dataSync();
      
      // Exploration vs exploitation
      let actionIndex;
      if (Math.random() < explorationRate) {
          // Random exploration
          actionIndex = Math.floor(Math.random() * probs.length);
      } else {
          // Exploitation - choose best action
          actionIndex = output.argMax(1).dataSync()[0];
      }
      
      // Add some randomness based on confidence
      const confidence = probs[actionIndex];
      if (confidence < 0.7 && Math.random() < 0.3) {
          actionIndex = output.argMin(1).dataSync()[0];
      }
      
      input.dispose();
      output.dispose();
      
      return actionIndex;
  }






  const model = createModel(5,5,3);







  /*

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
  
  }*/
  
