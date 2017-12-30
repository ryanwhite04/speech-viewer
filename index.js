const generate = require('./src/generator')(3);

console.log(getCurves(0)(process.argv.slice(2)[0]))
// DEBUG=generator node index [, sentence]

function getCurves(speaker = 0) {
  return sentence => generate(speaker, sentence).curves
}



