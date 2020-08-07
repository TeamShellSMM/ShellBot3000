const assert10 = require('assert');

describe('judge:processVotes', function () {
  describe('processVotes 1 votes needed', function () {
    before(() => {
      TEST.ts.teamVariables.VotesNeeded = '1';
      TEST.ts.teamVariables.ApprovalVotesNeeded = '1';
      TEST.ts.teamVariables.RejectVotesNeeded = '1';
      TEST.ts.teamVariables.FixVotesNeeded = '1';
    });

    it('1 approve = approved', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          approvalVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.APPROVED,
      );
    });
    it('1 reject = rejected', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });
    it('1 fix = need fix', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });

    it('1 approved,1 fix = approved', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 1,
          approvalVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.APPROVED,
      );
    });
    it('1 reject,1 approval = tie', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          approvalVotesCount: 1,
          rejectVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.comboBreaker'),
        },
      );
    });
    it('1 reject,1 tie = tie', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          fixVotesCount: 1,
          rejectVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.comboBreaker'),
        },
      );
    });

    it('1 approved,2 fix = fixed', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 2,
          approvalVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });
  });

  describe('2 votes needed, same', function () {
    before(() => {
      TEST.ts.teamVariables.VotesNeeded = '2';
      TEST.ts.teamVariables.ApprovalVotesNeeded = '2';
      TEST.ts.teamVariables.RejectVotesNeeded = '2';
      TEST.ts.teamVariables.FixVotesNeeded = '2';
    });

    it('1 approve vote = not enough', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          approvalVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.numVotesNeeded'),
        },
      );
    });
    it('1 reject vote = not enough', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          rejectVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.numVotesNeeded'),
        },
      );
    });
    it('1 fix vote = not enough', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          fixVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.numVotesNeeded'),
        },
      );
    });
    it('2 approve vote = approved', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.APPROVED,
      );
    });
    it('2 reject vote = rejected', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });
    it('2 fix vote = need fix', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });

    it('1 fix,1 approve = need fix', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 1,
          approvalVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });

    it('2 rejects,2 approve = tie', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 2,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.comboBreaker'),
        },
      );
    });

    it('3 rejects,2 approve = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 3,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });

    it('2 approve,2 fix = approved', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesCount: 2,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.APPROVED,
      );
    });

    it('2 rejects,1 fix vote,1 approve = tie', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          rejectVotesCount: 2,
          fixVotesCount: 1,
          approvalVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.comboBreaker'),
        },
      );
    });

    it('2 rejects,2 approve,1 fix vote=need fix', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 2,
          fixVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });
  });
  describe('3 approvals, 2 rejects', function () {
    before(() => {
      TEST.ts.teamVariables.VotesNeeded = '3';
      TEST.ts.teamVariables.ApprovalVotesNeeded = '3';
      TEST.ts.teamVariables.RejectVotesNeeded = '2';
      TEST.ts.teamVariables.FixVotesNeeded = '3';
    });

    it('2 rejects = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });

    it('2 rejects,2 approve = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });

    it('2 rejects,3 approve = tie', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 3,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.comboBreaker'),
        },
      );
    });

    it('3 rejects,3 approve = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });

    it('3 rejects,4 approve = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          rejectVotesCount: 2,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.REJECTED,
      );
    });
  });

  describe('processVotes 1 votes needed', function () {
    before(() => {
      TEST.ts.teamVariables.VotesNeeded = null;
      TEST.ts.teamVariables.ApprovalVotesNeeded = '1';
      TEST.ts.teamVariables.RejectVotesNeeded = '1';
      TEST.ts.teamVariables.FixVotesNeeded = null;
    });

    it('1 approve, 2 fix = fixed', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          approvalVotesCount: 1,
          fixVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });
  });

  describe('3 approvals but is passed an override number of votes', function () {
    before(() => {
      TEST.ts.teamVariables.VotesNeeded = 3;
      TEST.ts.teamVariables.ApprovalVotesNeeded = 3;
      TEST.ts.teamVariables.RejectVotesNeeded = 2;
      TEST.ts.teamVariables.FixVotesNeeded = 3;
    });

    it('2 approve, 2 ApproveVotesNeeded', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          approvalVotesNeeded: 2,
          approvalVotesCount: 2,
        }),
        TEST.ts.LEVEL_STATUS.APPROVED,
      );
    });

    it('1 approve, 2 approveVotesNeeded ', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          approvalVotesNeeded: 2,
          approvalVotesCount: 1,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.numVotesNeeded'),
        },
      );
    });

    it('3 rejects,4 approve = reject', async () => {
      assert.equal(
        await TEST.ts.processVotes({
          fixVotesNeeded: 2,
          fixVotesCount: 1,
          approvalVotesCount: 1,
        }),
        TEST.ts.LEVEL_STATUS.NEED_FIX,
      );
    });

    it('3 approve needed, 2 fix needed, 2 approves=not enough votes', async () => {
      await assert10.rejects(
        TEST.ts.processVotes({
          approvalVotesNeeded: 3,
          fixVotesNeeded: 2,
          approvalVotesCount: 2,
        }),
        {
          name: 'UserError',
          message: await TEST.ts.message('approval.numVotesNeeded'),
        },
      );
    });
  });
});

describe('judge:checkForAgreement', () => {
  it('1 agreeing votes, 2 agreeing votes needed, within tolerance=false', async () => {
    assert.isFalse(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [{ difficulty_vote: 1 }],
        fixVotes: [],
        rejectVotes: [],
      }),
    );
  });

  it('2 agreeing votes, within tolerance=true', async () => {
    assert.isTrue(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [
          { difficulty_vote: 1 },
          { difficulty_vote: 1 },
        ],
        fixVotes: [],
        rejectVotes: [],
      }),
    );
  });

  it('2 approve/fix votes, within tolerance=true', async () => {
    assert.isTrue(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [{ difficulty_vote: 1 }],
        fixVotes: [{ difficulty_vote: 1 }],
        rejectVotes: [],
      }),
    );
  });

  it('3 approve/fix votes, within tolerance=true', async () => {
    assert.isTrue(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 3,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [
          { difficulty_vote: 1 },
          { difficulty_vote: 1.5 },
          { difficulty_vote: 1 },
        ],
        fixVotes: [{ difficulty_vote: 1 }],
        rejectVotes: [],
      }),
    );
  });

  // agreeingVotesNeeded > 1

  it('3 approve/fix votes, within tolerance=true', async () => {
    assert.isTrue(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 3,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [
          { difficulty_vote: 1 },
          { difficulty_vote: 1.5 },
          { difficulty_vote: 1 },
        ],
        fixVotes: [{ difficulty_vote: 1 }],
        rejectVotes: [],
      }),
    );
  });

  it('2 approve/fix votes, within tolerance,with 1 =true', async () => {
    assert.isTrue(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [{ difficulty_vote: 1 }],
        fixVotes: [{ difficulty_vote: 1 }],
        rejectVotes: [],
      }),
    );
  });

  it('2 agreeing votes, not within tolerance=false', async () => {
    assert.isFalse(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [
          { difficulty_vote: 1 },
          { difficulty_vote: 2 },
        ],
        fixVotes: [],
        rejectVotes: [],
      }),
    );
  });

  it('2 agreeing votes, 1 reject=false', async () => {
    assert.isFalse(
      TEST.ts.checkForAgreement({
        AgreeingVotesNeeded: 2,
        AgreeingMaxDifference: 0.5,
        approvalVotes: [
          { difficulty_vote: 1 },
          { difficulty_vote: 1 },
        ],
        fixVotes: [],
        rejectVotes: [{ difficulty_vote: 1 }],
      }),
    );
  });
});

describe('oneVoteAway', function () {
  before(() => {
    TEST.ts.teamVariables.VotesNeeded = 3;
    TEST.ts.teamVariables.ApprovalVotesNeeded = 3;
    TEST.ts.teamVariables.RejectVotesNeeded = 3;
    TEST.ts.teamVariables.FixVotesNeeded = 3;
  });

  it('no votes', async () => {
    assert.isFalse(await TEST.ts.oneVoteAway());
  });

  it('1 votes', async () => {
    assert.equal(
      await TEST.ts.oneVoteAway({
        rejectVotesCount: 1,
        fixVotesCount: 1,
      }),
      'none',
    );
  });

  it('1 votes away approve', async () => {
    assert.equal(
      await TEST.ts.oneVoteAway({
        rejectVotesCount: 1,
        approvalVotesCount: 2,
        fixVotesCount: 1,
      }),
      TEST.ts.LEVEL_STATUS.APPROVED,
    );
  });

  it('1 votes away reject', async () => {
    assert.equal(
      await TEST.ts.oneVoteAway({
        rejectVotesCount: 2,
        fixVotesCount: 1,
      }),
      TEST.ts.LEVEL_STATUS.REJECTED,
    );
  });

  it('1 votes away fix', async () => {
    assert.equal(
      await TEST.ts.oneVoteAway({
        fixVotesCount: 2,
      }),
      TEST.ts.LEVEL_STATUS.NEED_FIX,
    );
  });

  it('1 votes away fix (w approve)', async () => {
    assert.equal(
      await TEST.ts.oneVoteAway({
        fixVotesCount: 1,
        approvalVotesCount: 1,
      }),
      TEST.ts.LEVEL_STATUS.NEED_FIX,
    );
  });

  it('unknown error', async () => {
    const processVotes = sinon.stub(TEST.ts, 'processVotes');
    processVotes.throws(new Error('unknown'));
    await assert10.rejects(
      TEST.ts.oneVoteAway({
        fixVotesCount: 1,
        approvalVotesCount: 1,
      }),
      {
        name: 'Error',
        message: 'unknown',
      },
    );
    processVotes.restore();
  });
});
