import test from 'node:test'
import assert from 'node:assert/strict'
import { createInstallController, isAppleMobile, isEmbeddedBrowser, shareInstallLink, INSTALL_URL } from '../services/installFlow.js'
function environment({standalone=false,legacy=false}={}) {
 const win=new EventTarget(),media=new EventTarget();media.matches=standalone
 Object.assign(win,{navigator:{standalone:legacy},matchMedia:()=>media})
 return {win,media}
}
test('standalone and legacy iOS modes show ready without attempting a prompt',async()=>{
 for(const options of [{standalone:true},{legacy:true}]){const {win}=environment(options);const controller=createInstallController(win);assert.equal(controller.getSnapshot().standalone,true);assert.equal(await controller.requestInstall(),'ready')}
})
test('native prompt is captured early, only called on request, and consumed once',async()=>{
 const {win}=environment();const controller=createInstallController(win);controller.start();let calls=0
 const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=()=>{calls++;return Promise.resolve({outcome:'accepted'})}
 win.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(calls,0);assert.equal(controller.getSnapshot().available,true)
 assert.equal(await controller.requestInstall(),'accepted');assert.equal(calls,1);assert.equal(controller.getSnapshot().installed,false)
 assert.equal(await controller.requestInstall(),'manual')
 win.dispatchEvent(new Event('appinstalled'));assert.equal(controller.getSnapshot().installed,true)
 controller.stop()
})
test('prompt cancellation or errors never claim installation and manual fallback is available',async()=>{
 for(const expected of ['dismissed','manual']){
  const {win}=environment();const c=createInstallController(win);c.start()
  const event=new Event('beforeinstallprompt');event.prompt=()=>expected==='manual'?Promise.reject(new Error('unsupported')):Promise.resolve();event.userChoice=Promise.resolve({outcome:'dismissed'})
  win.dispatchEvent(event);assert.equal(await c.requestInstall(),expected);assert.equal(c.getSnapshot().installed,false);assert.equal(c.getSnapshot().busy,false);c.stop()
 }
})
test('standalone changes are observed and lifecycle listeners are removed',()=>{
 const {win,media}=environment();const c=createInstallController(win);c.start();let updates=0;const unsubscribe=c.subscribe(()=>updates++)
 media.matches=true;media.dispatchEvent(new Event('change'));assert.equal(c.getSnapshot().standalone,true);assert.equal(updates,1)
 unsubscribe();c.stop();media.matches=false;media.dispatchEvent(new Event('change'));assert.equal(updates,1);assert.equal(c.getSnapshot().standalone,true)
})
test('Apple and embedded detection only select guide content',()=>{
 assert.equal(isAppleMobile({userAgent:'iPhone'}),true);assert.equal(isAppleMobile({platform:'MacIntel',maxTouchPoints:5}),true)
 assert.equal(isAppleMobile({userAgent:'Android'}),false);assert.equal(isEmbeddedBrowser({userAgent:'iPhone Instagram'}),true)
})
test('share payload contains the canonical installation URL, clipboard fallback copies the link',async()=>{
 let payload,copied
 assert.equal(await shareInstallLink({share:async value=>payload=value}),'shared');assert.equal(payload.url,INSTALL_URL);assert.equal(payload.title,'FCM Games')
 assert.equal(await shareInstallLink({clipboard:{writeText:async value=>copied=value}}),'copied');assert.equal(copied,INSTALL_URL)
 assert.equal(await shareInstallLink({}),'manual')
 assert.equal(await shareInstallLink({share:async()=>{throw new Error('no')},clipboard:{writeText:async value=>copied=value}}),'copied')
})
test('cancelled sharing does not silently copy the link',async()=>{
 let copied=false
 const result=await shareInstallLink({share:async()=>{throw Object.assign(new Error('cancel'),{name:'AbortError'})},clipboard:{writeText:async()=>copied=true}})
 assert.equal(result,'cancelled');assert.equal(copied,false)
})
