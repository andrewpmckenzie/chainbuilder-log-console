var assert = require('chai').assert;
var chainBuilder = require('chainbuilder');

describe('chainbuilder-log-console', function () {
  var myChain, methods, mixins, output;

  beforeEach(function () {
    output = [];

    var log = function (out) {
      out = out.replace(/..\dms$/, '  ?ms');
      output.push(out);
    };


    var $beginTwice = function (cb) { cb(null, 'beginning block'); };
    var $endTwice = function (chain, cb) {
      chain.run('c1', function (e, r) {
        if (e) return cb(e);
        chain.run('c2', cb);
      });
    };
    $beginTwice.$beginSubchain = 'block';
    $endTwice.$endSubchain = 'block';

    var withArgTransform = function (a, b, c, cb) { cb(null, 'done!'); };
    withArgTransform.$args = [{ type: 'string' }, { type: 'number', default: 2}, { defaultToPreviousResult: true }];

    var testOne = function (cb) { cb(null, 'one'); };
    var testTwo = function (cb) { cb(null, 'two'); };
    var testThree = function (arg, cb) { cb(null, arg + '-two'); };

    var withSubchain = function (cb) { this.newChain().testOne().run(cb); };

    var doThrow = function (a, cb) { cb(new Error(a)); };

    methods = {
      $beginTwice: $beginTwice,
      $endTwice: $endTwice,
      withArgTransform: withArgTransform,
      doThrow: doThrow,
      testOne: testOne,
      testTwo: testTwo,
      testThree: testThree,
      withSubchain: withSubchain
    };

    mixins = [
      require('..')({ log: log, width: 50 })
    ];

    myChain = chainBuilder({ methods: methods, mixins: mixins });
  });

  it('should log method calls and results', function (done) {
    myChain()
      .transformResult(function (r) { return r + ' bar' })
      .run('foo', function (e, r) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  "foo"                                      ',
            ' ├→ transformResult([Function])                   ',
            ' │← "foo bar"                                  ?ms',
            ' ┴  ⟹  "foo bar"                               ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should show transformed args', function (done) {
    myChain()
      .withArgTransform(function (r) { return 'a'; })
      .run('init', function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  "init"                                     ',
            ' ├→ withArgTransform("a", 2, "init")              ',
            ' │← "done!"                                    ?ms',
            ' ┴  ⟹  "done!"                                 ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should show embedded chains', function (done) {
    myChain()
      .withSubchain()
      .$beginTwice()
        .testTwo()
        .$beginTwice()
          .withSubchain()
        .$endTwice()
      .$endTwice()
      .run('init', function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  "init"                                     ',
            ' ├→ withSubchain()                                ',
            ' │ ┬  ⟸  null                                     ',
            ' │ ├→ testOne()                                   ',
            ' │ │← "one"                                    ?ms',
            ' │ ┴  ⟹  "one"                                 ?ms',
            ' │← "one"                                      ?ms',
            ' ├→ $beginTwice()                                 ',
            ' │← "beginning block"                          ?ms',
            ' ├→ $endTwice(Chain(links=3))                     ',
            ' │ ┬  ⟸  "c1"                                     ',
            ' │ ├→ testTwo()                                   ',
            ' │ │← "two"                                    ?ms',
            ' │ ├→ $beginTwice()                               ',
            ' │ │← "beginning block"                        ?ms',
            ' │ ├→ $endTwice(Chain(links=1))                   ',
            ' │ │ ┬  ⟸  "c1"                                   ',
            ' │ │ ├→ withSubchain()                            ',
            ' │ │ │ ┬  ⟸  null                                 ',
            ' │ │ │ ├→ testOne()                               ',
            ' │ │ │ │← "one"                                ?ms',
            ' │ │ │ ┴  ⟹  "one"                             ?ms',
            ' │ │ │← "one"                                  ?ms',
            ' │ │ ┴  ⟹  "one"                               ?ms',
            ' │ │ ┬  ⟸  "c2"                                   ',
            ' │ │ ├→ withSubchain()                            ',
            ' │ │ │ ┬  ⟸  null                                 ',
            ' │ │ │ ├→ testOne()                               ',
            ' │ │ │ │← "one"                                ?ms',
            ' │ │ │ ┴  ⟹  "one"                             ?ms',
            ' │ │ │← "one"                                  ?ms',
            ' │ │ ┴  ⟹  "one"                               ?ms',
            ' │ │← "one"                                    ?ms',
            ' │ ┴  ⟹  "one"                                 ?ms',
            ' │ ┬  ⟸  "c2"                                     ',
            ' │ ├→ testTwo()                                   ',
            ' │ │← "two"                                    ?ms',
            ' │ ├→ $beginTwice()                               ',
            ' │ │← "beginning block"                        ?ms',
            ' │ ├→ $endTwice(Chain(links=1))                   ',
            ' │ │ ┬  ⟸  "c1"                                   ',
            ' │ │ ├→ withSubchain()                            ',
            ' │ │ │ ┬  ⟸  null                                 ',
            ' │ │ │ ├→ testOne()                               ',
            ' │ │ │ │← "one"                                ?ms',
            ' │ │ │ ┴  ⟹  "one"                             ?ms',
            ' │ │ │← "one"                                  ?ms',
            ' │ │ ┴  ⟹  "one"                               ?ms',
            ' │ │ ┬  ⟸  "c2"                                   ',
            ' │ │ ├→ withSubchain()                            ',
            ' │ │ │ ┬  ⟸  null                                 ',
            ' │ │ │ ├→ testOne()                               ',
            ' │ │ │ │← "one"                                ?ms',
            ' │ │ │ ┴  ⟹  "one"                             ?ms',
            ' │ │ │← "one"                                  ?ms',
            ' │ │ ┴  ⟹  "one"                               ?ms',
            ' │ │← "one"                                    ?ms',
            ' │ ┴  ⟹  "one"                                 ?ms',
            ' │← "one"                                      ?ms',
            ' ┴  ⟹  "one"                                   ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should show errors and skipped args', function (done) {
    myChain()
      .doThrow('BANG!')
      .testThree('skippedy doo')
      .recover(function (err, cb) { cb(null, 'foo'); })
      .run('init', function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  "init"                                     ',
            ' ├→ doThrow("BANG!")                              ',
            ' │✕ Error: BANG!                               ?ms',
            ' │                                                ',
            ' │⤸ testThree("skippedy doo")                     ',
            ' ├→ recover([Function])                           ',
            ' │← "foo"                                      ?ms',
            ' ┴  ⟹  "foo"                                   ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should treat a call to "end" as the end of the chain.', function (done) {
    myChain('init')
      .testOne()
      .end(function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  "init"                                     ',
            ' ├→ testOne()                                     ',
            ' │← "one"                                      ?ms',
            ' ┴  ⟹  "one"                                   ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should tidily print multiline values.', function (done) {
    var circRef = { };
    circRef['a'] = circRef;

    myChain({ aLongKeyThatForcesWrapping: 'two', anotherLongKeyThatForcesWrapping: 'four' })
      .inject({ five: 'six', six: 'seven' })
      .inject(circRef)
      .$beginTwice()
        .inject({ aLongKeyThatForcesWrapping: 'six', six: [ 'seven', 'eight' ] })
      .$endTwice()
      .doThrow('error...\nBANG!')
      .recover(function (e, cb) { cb(null, { aLongKeyThatForcesWrapping: 'six', nine: { aLongKeyThatForcesWrapping: 'eleven' } }); })
      .end(function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
            ' ┬  ⟸  {                                          ',
            ' │       "aLongKeyThatForcesWrapping": "two",     ',
            ' │       "anotherLongKeyThatForcesWrapping": "four"  ',
            ' │     }                                          ',
            ' ├→ inject({"five": "six", "six": "seven"})       ',
            ' │← {"five": "six", "six": "seven"}            ?ms',
            ' ├→ inject([Circular])                            ',
            ' │← [Circular]                                 ?ms',
            ' ├→ $beginTwice()                                 ',
            ' │← "beginning block"                          ?ms',
            ' ├→ $endTwice(Chain(links=1))                     ',
            ' │ ┬  ⟸  "c1"                                     ',
            ' │ ├→ inject({                                    ',
            ' │ │    "aLongKeyThatForcesWrapping": "six",      ',
            ' │ │    "six": ["seven", "eight"]                 ',
            ' │ │  })                                          ',
            ' │ │← {                                        ?ms',
            ' │ │    "aLongKeyThatForcesWrapping": "six",      ',
            ' │ │    "six": ["seven", "eight"]                 ',
            ' │ │  }                                           ',
            ' │ ┴  ⟹  {                                     ?ms',
            ' │       "aLongKeyThatForcesWrapping": "six",     ',
            ' │       "six": ["seven", "eight"]                ',
            ' │     }                                          ',
            ' │ ┬  ⟸  "c2"                                     ',
            ' │ ├→ inject({                                    ',
            ' │ │    "aLongKeyThatForcesWrapping": "six",      ',
            ' │ │    "six": ["seven", "eight"]                 ',
            ' │ │  })                                          ',
            ' │ │← {                                        ?ms',
            ' │ │    "aLongKeyThatForcesWrapping": "six",      ',
            ' │ │    "six": ["seven", "eight"]                 ',
            ' │ │  }                                           ',
            ' │ ┴  ⟹  {                                     ?ms',
            ' │       "aLongKeyThatForcesWrapping": "six",     ',
            ' │       "six": ["seven", "eight"]                ',
            ' │     }                                          ',
            ' │← {                                          ?ms',
            ' │    "aLongKeyThatForcesWrapping": "six",        ',
            ' │    "six": ["seven", "eight"]                   ',
            ' │  }                                             ',
            ' ├→ doThrow("error...\\nBANG!")                    ',
            ' │✕ Error: error...                            ?ms',
            ' │  BANG!                                         ',
            ' │                                                ',
            ' ├→ recover([Function])                           ',
            ' │← {                                          ?ms',
            ' │    "aLongKeyThatForcesWrapping": "six",        ',
            ' │    "nine": {                                   ',
            ' │      "aLongKeyThatForcesWrapping": "eleven"    ',
            ' │    }                                           ',
            ' │  }                                             ',
            ' ┴  ⟹  {                                       ?ms',
            '       "aLongKeyThatForcesWrapping": "six",       ',
            '       "nine": {                                  ',
            '         "aLongKeyThatForcesWrapping": "eleven"   ',
            '       }                                          ',
            '     }                                            '
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should show stacks when they\'re present.', function (done) {
    var myChain = chainBuilder({
      enableStack: true,
      methods: methods,
      mixins: mixins
    });

    myChain('init')
      .testOne()
      .$beginTwice()
        .inject('foo')
      .$endTwice()
      .end(function (e) {
        if (e) return done(e);
        try {
          assert.deepEqual(output, [
           ' ┬  ⟸  "init"                                     ',
           ' ├→ testOne()                       index.js:308:8',
           ' │← "one"                     index.js:29:35   ?ms',
           ' ├→ $beginTwice()                   index.js:309:8',
           ' │← "beginning block"         index.js:16:39   ?ms',
           ' ├→ $endTwice(Chain(links=1))       index.js:311:8',
           ' │ ┬  ⟸  "c1"                                     ',
           ' │ ├→ inject("foo")                index.js:310:10',
           ' │ │← "foo"                   index.js:18:13   ?ms',
           ' │ ┴  ⟹  "foo"                                 ?ms',
           ' │ ┬  ⟸  "c2"                                     ',
           ' │ ├→ inject("foo")                index.js:310:10',
           ' │ │← "foo"                   index.js:20:15   ?ms',
           ' │ ┴  ⟹  "foo"                                 ?ms',
           ' │← "foo"                     index.js:20:15   ?ms',
           ' ┴  ⟹  "foo"                                   ?ms'
          ]);
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});
