describe('judge', function () {
  describe('processVotes 1 votes needed', function () {
    before(() => {
      ts.teamVariables.VotesNeeded = 1
      ts.teamVariables.ApprovalVotesNeeded = 1
      ts.teamVariables.RejectVotesNeeded = 1
      ts.teamVariables.FixVotesNeeded = 1
    })

    it('1 approve = approved', async () => {
      assert.equal(ts.processVotes({
        approvalVotesCount: 1
      }), ts.LEVEL_STATUS.APPROVED)
    })
    it('1 reject = rejected', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 1
      }), ts.LEVEL_STATUS.REJECTED)
    })
    it('1 fix = need fix', async () => {
      assert.equal(ts.processVotes({
        fixVotesCount: 1
      }), ts.LEVEL_STATUS.NEED_FIX)
    })

    it('1 approved,1 fix = approved', async () => {
      assert.equal(ts.processVotes({
        fixVotesCount: 1,
        approvalVotesCount: 1,
      }), ts.LEVEL_STATUS.APPROVED)
    })
    it('1 reject,1 approval = tie', async () => {
      assert.throws(() => ts.processVotes({
        approvalVotesCount: 1,
        rejectVotesCount: 1,
      }), ts.UserError, ts.message('approval.comboBreaker'))
    })
    it('1 reject,1 tie = tie', async () => {
      assert.throws(() => ts.processVotes({
        fixVotesCount: 1,
        rejectVotesCount: 1,
      }), ts.UserError, ts.message('approval.comboBreaker'))
    })

  })

  describe('2 votes needed, same', function () {
    before(() => {
      ts.teamVariables.VotesNeeded = 2
      ts.teamVariables.ApprovalVotesNeeded = 2
      ts.teamVariables.RejectVotesNeeded = 2
      ts.teamVariables.FixVotesNeeded = 2
    })

    it('1 approve vote = not enough', async () => {
      assert.throws(() => ts.processVotes({
        approvalVotesCount: 1,
      }), ts.UserError, ts.message('approval.numVotesNeeded'))
    })
    it('1 reject vote = not enough', async () => {
      assert.throws(() => ts.processVotes({
        rejectVotesCount: 1,
      }), ts.UserError, ts.message('approval.numVotesNeeded'))
    })
    it('1 fix vote = not enough', async () => {
      assert.throws(() => ts.processVotes({
        fixVotesCount: 1,
      }), ts.UserError, ts.message('approval.numVotesNeeded'))
    })
    it('2 approve vote = approved', async () => {
      assert.equal(ts.processVotes({
        approvalVotesCount: 2,
      }), ts.LEVEL_STATUS.APPROVED)
    })
    it('2 reject vote = rejected', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
      }), ts.LEVEL_STATUS.REJECTED)
    })
    it('2 fix vote = need fix', async () => {
      assert.equal(ts.processVotes({
        fixVotesCount: 2,
      }), ts.LEVEL_STATUS.NEED_FIX)
    })

    it('1 fix,1 approve = need fix', async () => {
      assert.equal(ts.processVotes({
        fixVotesCount: 1,
        approvalVotesCount: 1,
      }), ts.LEVEL_STATUS.NEED_FIX)
    })

    it('2 rejects,2 approve = tie', async () => {
      assert.throws(() => ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 2,
      }),ts.message('approval.comboBreaker'))
    })

    it('3 rejects,2 approve = reject', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 3,
        approvalVotesCount: 2,
      }),ts.LEVEL_STATUS.REJECTED)
    })

    it('2 approve,2 fix = approved', async () => {
      assert.equal(ts.processVotes({
        fixVotesCount: 2,
        approvalVotesCount: 2,
      }),ts.LEVEL_STATUS.APPROVED)
    })

    it('2 rejects,1 fix vote,1 approve = tie', async () => {
      assert.throws(() => ts.processVotes({
        rejectVotesCount: 2,
        fixVotesCount: 1,
        approvalVotesCount: 1,
      }), ts.UserError, ts.message('approval.comboBreaker'))
    })

    it('2 rejects,2 approve,1 fix vote=need fix', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 2,
        fixVotesCount: 1,
      }), ts.LEVEL_STATUS.NEED_FIX)
    })
  })
  describe('3 approvals, 2 rejects', function () {
    before(() => {
      ts.teamVariables.VotesNeeded = 3
      ts.teamVariables.ApprovalVotesNeeded = 3
      ts.teamVariables.RejectVotesNeeded = 2
      ts.teamVariables.FixVotesNeeded = 3
    })

    it('2 rejects = reject', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
      }),ts.LEVEL_STATUS.REJECTED)
    })

    it('2 rejects,2 approve = reject', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 2,
      }),ts.LEVEL_STATUS.REJECTED)
    })

    it('2 rejects,3 approve = tie', async () => {
      assert.throws(()=>ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 3,
      }),ts.UserError,ts.message('approval.comboBreaker'))
    })

    it('3 rejects,3 approve = reject', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 2,
      }),ts.LEVEL_STATUS.REJECTED)
    })

    it('3 rejects,4 approve = reject', async () => {
      assert.equal(ts.processVotes({
        rejectVotesCount: 2,
        approvalVotesCount: 2,
      }),ts.LEVEL_STATUS.REJECTED)
    })

  })
})
