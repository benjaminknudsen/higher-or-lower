import test from 'node:test'
import assert from 'node:assert/strict'
import { installViewportSizing } from '../viewport.js'

function environment(standalone = true) {
  const win = new EventTarget()
  const doc = new EventTarget()
  const values = new Map()
  const frames = new Map()
  let id = 0
  Object.assign(win, {
    innerHeight: 810,
    matchMedia: () => ({ matches: standalone }),
    navigator: {},
    visualViewport: Object.assign(new EventTarget(), { height: 844, scale: 1 }),
    requestAnimationFrame: callback => { frames.set(++id, callback); return id },
    cancelAnimationFrame: frame => frames.delete(frame),
  })
  Object.assign(doc, {
    visibilityState: 'visible',
    documentElement: { style: {
      setProperty: (key, value) => values.set(key, value),
      removeProperty: key => values.delete(key),
    } },
  })
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()) }
  return { win, doc, values, frames, flush, height: () => values.get('--app-viewport-height') }
}

test('installed viewport is sized immediately and settles without a scroll', () => {
  const e = environment()
  installViewportSizing(e.win, e.doc)
  assert.equal(e.height(), '844px')
  e.win.visualViewport.height = 852
  e.flush()
  assert.equal(e.height(), '852px')
  e.win.visualViewport.height = 860
  e.flush()
  assert.equal(e.height(), '860px')
  assert.equal(e.frames.size, 0)
})
test('resume, viewport resize and orientation sizing are handled without polling', () => {
  const e = environment()
  installViewportSizing(e.win, e.doc)
  for (const target of [e.win, e.win.visualViewport]) {
    e.win.visualViewport.height -= 100
    target.dispatchEvent(new Event('resize'))
    e.flush()
    assert.equal(e.height(), `${e.win.visualViewport.height}px`)
  }
  for (const [target, event] of [[e.win, 'pageshow'], [e.doc, 'visibilitychange']]) {
    e.win.visualViewport.height = 932
    target.dispatchEvent(new Event(event))
    e.flush()
    assert.equal(e.height(), '932px')
  }
})
test('normal browser tabs keep CSS dvh while legacy iOS standalone is supported', () => {
  const e = environment(false)
  installViewportSizing(e.win, e.doc)
  assert.equal(e.height(), undefined)
  assert.equal(e.frames.size, 0)
  e.win.navigator.standalone = true
  e.win.visualViewport = undefined
  installViewportSizing(e.win, e.doc)
  assert.equal(e.height(), '810px')
})
test('zoom and invalid viewport measurements never collapse or rescale the layout', () => {
  const e = environment()
  installViewportSizing(e.win, e.doc)
  e.win.visualViewport.scale = 2
  e.win.visualViewport.height = 422
  e.flush()
  assert.equal(e.height(), '844px')
  e.win.visualViewport.scale = 1
  for (const height of [0, -1, NaN, Infinity]) {
    e.win.visualViewport.height = height
    e.win.dispatchEvent(new Event('resize'))
    e.flush()
    assert.equal(e.height(), '844px')
  }
})
test('cleanup removes listeners and queued frames', () => {
  const e = environment()
  const cleanup = installViewportSizing(e.win, e.doc)
  cleanup()
  assert.equal(e.frames.size, 0)
  e.win.dispatchEvent(new Event('resize'))
  e.win.dispatchEvent(new Event('pageshow'))
  e.win.visualViewport.dispatchEvent(new Event('resize'))
  e.doc.dispatchEvent(new Event('visibilitychange'))
  e.flush()
  assert.equal(e.height(), undefined)
  assert.equal(e.frames.size, 0)
})
