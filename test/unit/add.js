describe('!add', function () {
  describe('pointsNeededForLevel. Points(p),Minimum(m),Next(n),Levels submitted(l). 0 means they can upload a level', function () {

    it(`p=0,m=0,n=0,l=0 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0,
        min:0,
        next:0,
        levelsUploaded:0,
      }),0)
    })

    it(`p=0,m=0,n=0,l=1 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0,
        min:0,
        next:0,
        levelsUploaded:1,
      }),0)
    })

    it(`p=0,m=0,n=0,l=2 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0,
        min:0,
        next:0,
        levelsUploaded:2,
      }),0)
    })

    it(`p=0,m=2,n=0,l=0  => 2`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0,
        min:2,
        next:0,
        levelsUploaded:0,
      }),2)
    })

    it(`p=1,m=2,n=0,l=0 => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:1,
        min:2,
        next:0,
        levelsUploaded:0,
      }),1)
    })

    it(`p=2,m=2,n=0,l=0 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:2,
        min:2,
        next:0,
        levelsUploaded:0,
      }),0)
    })

    it(`p=3,m=2,n=0,l=0 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:3,
        min:2,
        next:0,
        levelsUploaded:0,
      }),0)
    })

    it(`p=2,m=2,n=0,l=1  => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:2,
        min:2,
        next:0,
        levelsUploaded:1,
      }),0)
    })

    it(`p=0,m=2,n=1,l=0  => 2`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0,
        min:2,
        next:1,
        levelsUploaded:0,
      }),2)
    })

    it(`p=1,m=2,n=1,l=0  => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:1,
        min:2,
        next:1,
        levelsUploaded:0,
      }),1)
    })

    it(`p=2,m=2,n=1,l=0  => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:2,
        min:2,
        next:1,
        levelsUploaded:0,
      }),0)
    })

    it(`p=2, m=2,n=1,l=1  => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:2,
        min:2,
        next:1,
        levelsUploaded:1,
      }),1)
    })

    it(`p=3, m=2,n=1,l=1  => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:3,
        min:2,
        next:1,
        levelsUploaded:1,
      }),0)
    })

    it(`p=3, m=2,n=1,l=2  => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:3,
        min:2,
        next:1,
        levelsUploaded:2,
      }),1)
    })

    it(`p=4, m=2,n=1,l=2 => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:4,
        min:2,
        next:1,
        levelsUploaded:2,
      }),0)
    })

    it(`p=3, m=2,n=1,l=1  => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:3,
        min:2,
        next:1,
        levelsUploaded:0,
      }),0)
    })

    //TODO:include more tests to check for float stuff, but sum is done in database
    it(`p=0.7+0.2+0.1, m=1,n=0,l=0  => 0`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
        points:0.7+0.2+0.1,
        min:1,
        next:0,
        levelsUploaded:0,
      }),0)
    })
  })

  describe('pointsNeededForLevel. with free submissions(f)', function () {
    it(`p=2, m=0,n=1,l=4,f=1  => 1`, async () => {
      assert.equal(TEST.ts.pointsNeededForLevel({
          points:2,
          min:0,
          next:1,
          levelsUploaded:4,
          freeLevels:1,
      }),1)
    })
  })
})
