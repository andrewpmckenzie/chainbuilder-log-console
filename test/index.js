var assert = require('chai').assert;
var chainBuilder = require('chainbuilder');

describe('chainbuilder-log-console', function () {
  var myChain, output;

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

    myChain = chainBuilder({
      methods: {
        $beginTwice: $beginTwice,
        $endTwice: $endTwice,
        withArgTransform: withArgTransform,
        doThrow: doThrow,
        testOne: testOne,
        testTwo: testTwo,
        testThree: testThree,
        withSubchain: withSubchain
      },
      mixins: [
        require('..')({ log: log, width: 50 })
      ]
    });
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
});
