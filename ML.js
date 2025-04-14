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
  


  function decideAction(beamDistances, epsilon = 0.2) {
    const input = tf.tensor2d([beamDistances]);
    const output = model.predict(input);
    const probs = output.dataSync();
  
    let actionIndex;
    if (Math.random() < epsilon) {
      actionIndex = Math.floor(Math.random() * probs.length);
    } else {
      actionIndex = output.argMax(1).dataSync()[0];
    }
    input.dispose();
    output.dispose();
    return actionIndex;
  }


  function trainModel(beamDistances, actionIndex, rewardDiff) {
    const inputs = tf.tensor2d([beamDistances]);
    
    // Create a softer target array
    const targetArray = [0.33, 0.33, 0.33]; // baseline uniform confidence
    targetArray[actionIndex] = Math.min(1, Math.max(0, 0.33 + rewardDiff)); // nudge up/down
  
    const targets = tf.tensor2d([targetArray]);
  
    model.fit(inputs, targets, {
      epochs: 1,
      shuffle: false,
      verbose: 0
    }).then(() => {
      inputs.dispose();
      targets.dispose();
    }).catch((error) => {
      console.error('Error during training:', error);
      inputs.dispose();
      targets.dispose();
    });
  
    
  }




  const model = createModel(5,5,3);

