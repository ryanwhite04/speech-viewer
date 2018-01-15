const transcripts = require('speech-samples/transcripts').reduce((initials, [hanzi, full, parts], i) => {
  parts.split(' ')
    .reduce((a, b, c) => { const d = ~~(c/2); a[d] ? a[d].push(b) : a[d] = [b]; return a }, [])
    .map(([initial, final]) => {

      initials[initial] ?
        initials[initial][final.slice(0, -1)] ? 
          initials[initial][final.slice(0, -1)]++ :
          initials[initial][final.slice(0, -1)] = 1 :
        initials[initial] = { [final.slice(0, -1)]: 0 }
    })
  return initials;
}, {})

require('fs').writeFileSync('pinyin.json', JSON.stringify(transcripts, null, 2))
console.log({ transcripts })