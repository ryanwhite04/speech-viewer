let output = require('./output')[0]
  // .slice(0, 20)
output = output.split('')
  .reduce((samples, sample, i) => {
    index = ~~(i/2); samples[index] || (samples[index] = []);
    samples[index].push(+sample - 1);
    return samples
  }, new Array(output.length / 2))
  .reduce((samples, [actual, predicted], i) => {
    // console.log({ samples, actual, predicted, i })

    samples[actual][predicted]++;
    return samples
  }, [...new Array(5)].map(() => new Array(5).fill(0)))

console.log(output);