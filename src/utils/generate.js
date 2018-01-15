import debug from 'debug'
import regress from './regress'

export default options => ({ tags, frames }) => {

  const log = debug('generate')
  const contour = frames.map(format).reduce(clean(4), [])
  const syllables = tags
    .reduce(outline(contour), [])
    .filter(({ x }) => x)
    .filter(({ x: [start, end] }) => start && end && end - start > 3)
    .map(regress(contour, options))
  
  log(options, {
    tags: [tags.length, syllables.length],
    frames: [frames.length, contour.length],
  })

  return { contour, syllables }
}

function format(frequency, name) {
  // This will probably get changed in future, when only frequency is passed in
  // TODO input will become (frequency, name) instead
  return ({
    frequency,
    name,
  })
}

function clean(window) {
  // Just removes small spikes of sounds that interfere with getRange
  // any sounds spike less than window * 10ms will get flattened to 0hz
  return (data, { frequency, name }, i, frames) => [...data, {
    name, 
    frequency: (i && i < frames.length - 2 && frequency && !data.slice(-1)[0].frequency && frames.slice(i + 1).slice(0, window).map(({ frequency }) => frequency).includes(0)) ? 0 : frequency
  }];
}

function outline(data, buffer = 20) {
  // This can definitely be fine-tuned
  // given an x value, the position of a click in a stream of frame frequencies
  // it should return the correct bounds of the syllable
  // The main speaker clicked "before" the syllable, so it is quite difficult to get it right
  // Still seems to work quite well, as you can see in sentence 1, but has a few errors here and there for other sentences
  // If things turn out badly, come back here to fine tune, and make it more robust, to end up with less errors for the ML

  // TODO Update, the range being returned quite often has a start which comes after it's end, needs to be fixed
  return (reduced, tag, i, tags) => {

    // function getAverage(reduced) {
    //   debugger
    //   return ~~(reduced.reduce((sum, { x: [ start, end] }) => sum + (end - start), 0) / reduced.length)
    // }

    // const average = getAverage(reduced);

    const region = data.slice(i ? reduced[i - 1].x[1] : tag.time, tags[i + 1] ? (buffer + tags[i+1].time) : undefined)
    const start = (region.find(({ frequency, name }) => frequency && name > tag.time) || data[tag.time]).name
    const end = (region.find(({ frequency, name }) => name > start && !frequency) || region.slice(-1)[0]).name
    const [min, max] = ['min', 'max'].map(func => Math[func](...data.slice(start, end).map(({ frequency }) => frequency)))

    return [...reduced, Object.assign(tag, { name: i, x: [start, end], min, max })]
  }
}