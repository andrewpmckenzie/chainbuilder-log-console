# chainbuilder-log-console [![Build Status](https://travis-ci.org/andrewpmckenzie/chainbuilder-log-console.svg)](https://travis-ci.org/andrewpmckenzie/chainbuilder-log-console)

A console logger for [chainbuilder](https://www.npmjs.com/package/chainbuilder). 

**Installation** `npm install chainbuilder chainbuilder-log-console --save`

**Usage**  
```javascript
var chainBuilder = require('chainbuilder');

var myChain = chainBuilder({
  methods: {
    /* ... your methods ... */
  },
  mixins: [
    require('chainbuilder-log-console')({
      // logs to debug instead of directly to console
      log: require('debug')('chainbuilder'),
      // includes args and results in output
      detailed: true
    })
  ]
});
```

**Example detailed output**  
```
┬ ⟸  3
│
├→ $beginWhile()
│ ┬ ⟸  3
│ │
│ ├→ plus(1)
│ │← 4                               0ms
│ │
│ ├→ times(3)
│ │← 12                              2ms
│ │
│ ┴ ⟹  12
│ ┬ ⟸  12
│ │
│ ├→ plus(1)
│ │← 13                              0ms
│ │
│ ├→ times(3)
│ │← 39                              2ms
│ │
│ ┴ ⟹  39
│← 39                                4ms
│
├→ plus(1)
│← 40                                0ms
│
┴ ⟹  40
```

**Key:**

| symbol           |  description                                       |
|------------------|----------------------------------------------------|
| `┬ ⟸ 12`        | initial value (of `12`)                            |
| `┴ ⟹  "onetwo"` | result (of `'onetwo'`)                             |
| `├→ plus(1)`     | call (of `plus(1)`)                                |
| `│⤸ plus(1)`     | skipped call (because a previous call errored)     |
| `│← 1`           | successful result (of 1)                           |
| `│✕ BANG`        | call resulted in an error (of `new Error('BANG')`) |

block call of `$beginMap`/`$endMap` with result `[4,6]`, and an iteration with initial value of `2`:
```
├→ $beginMap()
...
│ ┬ ⟸  2
│ ├→ plus(2)
│ │← 12
│ ┴ ⟹  4
...
│← [4,6]
```
