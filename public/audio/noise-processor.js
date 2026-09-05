class NoiseProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.type = (options && options.processorOptions && options.processorOptions.type) || 'white';
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
    this.lastBrown = 0.0;

    this.port.onmessage = (event) => {
      if (event.data && event.data.type) {
        this.type = event.data.type;
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const channels = output.length;
    const bufferLength = output[0].length;

    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      let sample = 0;

      if (this.type === 'white') {
        sample = white * 0.25;
      } else if (this.type === 'pink') {
        this.b0 = 0.99886 * this.b0 + white * 0.0555179;
        this.b1 = 0.99332 * this.b1 + white * 0.0750759;
        this.b2 = 0.96900 * this.b2 + white * 0.1538520;
        this.b3 = 0.86650 * this.b3 + white * 0.3104856;
        this.b4 = 0.55000 * this.b4 + white * 0.5329522;
        this.b5 = -0.76160 * this.b5 - white * 0.0168980;
        sample = (this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362) * 0.11;
        this.b6 = white * 0.115926;
      } else if (this.type === 'brown') {
        this.lastBrown = (this.lastBrown + 0.02 * white) / 1.02;
        sample = this.lastBrown * 3.2;
      }

      for (let c = 0; c < channels; c++) {
        output[c][i] = sample;
      }
    }

    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
