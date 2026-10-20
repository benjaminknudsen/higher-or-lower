import test from 'node:test'
import assert from 'node:assert/strict'
import { THEME_KEY, readTheme, saveTheme, applyTheme } from '../services/theme.js'
function documentDouble(){const attributes={};return {attributes,documentElement:{dataset:{}},querySelector:()=>({setAttribute:(key,value)=>attributes[key]=value})}}
test('theme defaults to Neon and only accepts the two known themes',()=>{
 for(const value of [null,'bad','neon'])assert.equal(readTheme({getItem:()=>value}),'neon')
 assert.equal(readTheme({getItem:()=> 'fcm'}),'fcm')
 assert.equal(readTheme({getItem(){throw new Error('blocked')}}),'neon')
})
test('theme persists across reads without touching other stored user data',()=>{
 const data=new Map([['profile','name'],['score','120']]);const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};const doc=documentDouble()
 saveTheme('fcm',storage,doc);assert.equal(data.get(THEME_KEY),'fcm');assert.equal(readTheme(storage),'fcm');assert.equal(doc.documentElement.dataset.theme,'fcm');assert.equal(doc.attributes.content,'#0D0D10')
 saveTheme('neon',storage,doc);assert.equal(readTheme(storage),'neon');assert.equal(data.get('profile'),'name');assert.equal(data.get('score'),'120');assert.equal(data.size,3)
})
test('blocked storage still applies a session theme and updates browser chrome',()=>{
 const doc=documentDouble();assert.equal(saveTheme('fcm',{setItem(){throw new Error('quota')}},doc),'fcm');assert.equal(doc.documentElement.dataset.theme,'fcm')
 applyTheme('invalid',doc);assert.equal(doc.documentElement.dataset.theme,'neon');assert.equal(doc.attributes.content,'#161625')
})
test('saved theme is applied before React loads, including blocked storage fallback',async()=>{
 const {readFileSync}=await import('node:fs');const {runInNewContext}=await import('node:vm')
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8')
 const bootstrap=html.match(/<script>([\s\S]*?)<\/script>/)[1]
 for(const value of ['fcm','neon',null]){
  const doc=documentDouble();runInNewContext(bootstrap,{document:doc,localStorage:{getItem:()=>value}})
  assert.equal(doc.documentElement.dataset.theme,value==='fcm'?'fcm':'neon')
 }
 const doc=documentDouble();runInNewContext(bootstrap,{document:doc,localStorage:{getItem(){throw new Error('denied')}}});assert.equal(doc.documentElement.dataset.theme,'neon')
 assert.ok(html.indexOf(bootstrap)<html.indexOf('/src/main.jsx'))
})
test('FCM text colours meet contrast targets and medal styles remain theme-independent',async()=>{
 function luminance(hex){const rgb=hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
 function contrast(a,b){const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05)}
 assert.ok(contrast('ffffff','e32636')>=4.5)
 assert.ok(contrast('ff7380','19191f')>=4.5)
 assert.ok(contrast('b9b9c3','19191f')>=4.5)
 const {readFileSync}=await import('node:fs')
 const css=readFileSync(new URL('../themes.css',import.meta.url),'utf8')
 assert.ok(!css.includes('.prestige-')&&!css.includes('--prestige-'))
 const medal=readFileSync(new URL('../components/HighScoreMedal.css',import.meta.url),'utf8')
 assert.ok(!medal.includes('--tone-')&&!medal.includes('--color-primary'))
})
