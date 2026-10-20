import test from 'node:test'
import assert from 'node:assert/strict'
import { medalProgress } from '../components/community/medalProgress.js'
import { HIGH_SCORE_MEDAL_TIERS, getHighScoreMedalTier } from './highScoreMedal.js'

test('medal presentation uses the existing thresholds for every score in the playable range',()=>{
  for(let score=0;score<=160;score++) {
    const view=medalProgress(score)
    assert.equal(view.best,score)
    assert.equal(view.current,getHighScoreMedalTier(score))
    const next=HIGH_SCORE_MEDAL_TIERS.find(tier=>tier.minScore>score)??null
    assert.equal(view.next,next)
    assert.equal(view.remaining,next?next.minScore-score:0)
  }
})
test('each exact threshold highlights that medal and moves the goal to the following tier',()=>{
  HIGH_SCORE_MEDAL_TIERS.forEach((tier,index)=>{
    const at=medalProgress(tier.minScore)
    assert.equal(at.current,tier)
    assert.equal(at.next,HIGH_SCORE_MEDAL_TIERS[index+1]??null)
    if(index>0) {
      const before=medalProgress(tier.minScore-1)
      assert.equal(before.next,tier)
      assert.equal(before.remaining,1)
    }
  })
})
test('new players, invalid records and the highest medal have honest presentation goals',()=>{
  for(const score of [undefined,null,-1,1.5,NaN,Infinity,'100']) {
    const view=medalProgress(score)
    assert.equal(view.best,0);assert.equal(view.current.label,'BEGINNER')
    assert.equal(view.next.label,'TALENT');assert.equal(view.remaining,10)
  }
  for(const score of [100,149,999]) {
    const view=medalProgress(score)
    assert.equal(view.current.label,'ULTIMATE');assert.equal(view.next,null);assert.equal(view.remaining,0)
  }
})
