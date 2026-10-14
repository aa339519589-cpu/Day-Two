import { chromium, webkit } from 'playwright'
import { expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const origin = process.env.TEST_URL || 'http://127.0.0.1:4173'
const out = 'ui-artifacts'
await mkdir(out, {recursive:true})
const results = []
for (const [engine, browserType] of [['chromium',chromium], ['webkit',webkit]]) {
  const browser = await browserType.launch()
  const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:'light',locale:'zh-CN'})
  const page = await context.newPage()
  const errors = []
  const consoleErrors = []
  page.on('console', message => {if(message.type()==='error') consoleErrors.push(message.text())})
  page.on('pageerror', error => errors.push(error.message))
  const screenshot = async name => {await page.screenshot({path:`${out}/${engine}-${name}.png`,fullPage:false})}
  const test = async (name, action) => {await action();results.push({engine,name,status:'passed'});console.log(`PASS ${engine} ${name}`)}
  try {
    await test('onboarding', async () => {
      await page.goto(origin, {waitUntil:'networkidle'})
      await screenshot('welcome')
      await page.getByLabel('你的名字').fill('明明')
      await page.getByRole('button',{name:'开始体验'}).click()
      await page.waitForURL('**/home')
      await screenshot('home-two')
    })
    await test('three-friend capacity', async () => {
      await page.getByRole('button',{name:'接受',exact:true}).click()
      await expect(page.locator('.friend-window')).toHaveCount(3)
      const data = await page.evaluate(() => JSON.parse(localStorage.getItem('daytwo-state-v1')))
      assert.equal(data.relations.filter(r => r.status === 'active').length,3)
      await screenshot('home-three')
      await page.reload();await page.waitForSelector('.friend-window')
      await expect(page.locator('.friend-window')).toHaveCount(3)
    })
    await test('one-photo viewport and vertical swipe', async () => {
      await page.getByRole('link',{name:'日常',exact:true}).click()
      await page.waitForSelector('.photo-slide img')
      const first = await page.locator('.photo-stage').getAttribute('data-current-id')
      const rail = page.locator('.photo-rail')
      // Exercise a real touch gesture in Chromium. The equivalent native scroll is used for WebKit.
      if (engine === 'chromium') {
        const client = await context.newCDPSession(page)
        await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:650}]})
        for (let y=610;y>=210;y-=40) {await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(16)}
        await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
        await client.detach()
      } else await rail.evaluate(n => n.scrollTo({top:n.clientHeight,behavior:'smooth'}))
      await page.waitForTimeout(1000)
      assert.notEqual(await page.locator('.photo-stage').getAttribute('data-current-id'),first)
      const visible = await rail.evaluate(n => {const r=n.getBoundingClientRect();return [...n.querySelectorAll('.photo-slide')].filter(el=>{const b=el.getBoundingClientRect();return Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>2}).length})
      assert.equal(visible,1)
      await page.getByRole('button',{name:'林可',exact:true}).click()
      await page.waitForTimeout(300)
      await screenshot('daily')
      await page.getByRole('button',{name:'查看完整照片'}).click()
      assert.ok(await page.locator('.photo-stage').evaluate(n=>n.classList.contains('show-full')))
      await page.getByRole('button',{name:'填满屏幕'}).click()
      await rail.tap({position:{x:170,y:300}})
      await page.waitForTimeout(250)
      assert.ok(await page.locator('.photo-stage').evaluate(n=>n.classList.contains('chrome-hidden')))
      await rail.tap({position:{x:170,y:300}})
      await page.waitForTimeout(250)
    })
    await test('photo reply and persistent chat', async () => {
      await page.getByRole('button',{name:'说点什么…'}).click()
      await page.waitForURL('**/chat/lin?moment=*')
      await expect(page.locator('.draft')).toBeVisible()
      const input = page.getByLabel('消息',{exact:true})
      await input.fill('这张照片好舒服。')
      await input.dispatchEvent('keydown',{key:'Enter',isComposing:true})
      assert.equal(await input.inputValue(),'这张照片好舒服。')
      await page.getByRole('button',{name:'发送',exact:true}).click()
      await expect(page.locator('.draft')).toHaveCount(0)
      await expect(page.getByText('这张照片好舒服。',{exact:true})).toBeVisible()
      await screenshot('chat')
      let b = await page.locator('.composer').boundingBox()
      assert.ok(Math.abs(b.y+b.height-844)<3)
      await page.setViewportSize({width:390,height:480})
      await page.waitForTimeout(300)
      b = await page.locator('.composer').boundingBox()
      assert.ok(Math.abs(b.y+b.height-480)<3)
      await page.setViewportSize({width:390,height:844})
      await page.reload();await page.waitForSelector('.composer')
      await expect(page.getByText('这张照片好舒服。',{exact:true})).toBeVisible()
    })
    await test('real upload and IndexedDB persistence', async () => {
      await page.goto(`${origin}/compose`)
      await page.locator('input[type="file"]').setInputFiles('public/photos/me-noodles.jpg')
      await page.getByLabel('照片描述').fill('今天的午饭')
      await screenshot('compose')
      await page.getByRole('button',{name:'发布',exact:true}).click()
      await page.waitForURL('**/feed/me?m=*')
      await page.waitForFunction(()=>document.querySelector('.photo-stage')?.textContent.includes('今天的午饭'))
      await page.reload()
      await page.waitForFunction(()=>document.querySelector('.photo-slide[aria-hidden="false"] img')?.naturalWidth>0)
      assert.ok((await page.locator('.photo-stage').textContent()).includes('今天的午饭'))
      await screenshot('uploaded')
    })
    if (engine === 'chromium') await test('legacy photo storage compatibility', async () => {
      await page.evaluate(async () => {
        const blob = await (await fetch('/photos/me-noodles.jpg')).blob()
        await new Promise((resolve,reject) => {
          const open=indexedDB.open('day-two',1)
          open.onerror=()=>reject(open.error)
          open.onsuccess=()=>{const db=open.result;const tx=db.transaction('images','readwrite');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.objectStore('images').put(blob,'legacy-test')}
        })
        const data=JSON.parse(localStorage.getItem('daytwo-state-v1'))
        data.moments.push({id:'legacy-test',authorId:'me',image:'idb:legacy-test',caption:'旧照片',createdAt:'2020-01-01T12:00:00.000Z',mine:true})
        localStorage.setItem('daytwo-state-v1',JSON.stringify(data))
      })
      await page.goto(`${origin}/feed/me?m=legacy-test`)
      await page.waitForFunction(()=>document.querySelector('.photo-stage')?.getAttribute('data-current-id')==='legacy-test' && document.querySelector('.photo-slide[aria-hidden="false"] img')?.naturalWidth>0)
    })
    await test('profile edit and appearance persistence', async () => {
      await page.goto(`${origin}/me`)
      await page.getByRole('button',{name:'编辑资料'}).click()
      await expect(page.locator('dialog[open]')).toBeVisible()
      await page.getByLabel('名字',{exact:true}).fill('小明')
      await page.getByLabel('简介',{exact:true}).fill('摄影和散步。')
      await page.getByRole('button',{name:'保存',exact:true}).click()
      await page.waitForTimeout(150)
      await expect(page.locator('dialog[open]')).toHaveCount(0)
      await screenshot('profile-light')
      await page.getByRole('button',{name:'深色',exact:true}).click()
      await page.reload();await page.waitForSelector('.profile-identity')
      assert.equal(await page.locator('html').getAttribute('data-theme'),'dark')
      assert.equal(await page.getByRole('heading',{name:'小明',exact:true}).count(),1)
      await screenshot('profile-dark')
      await page.getByRole('link',{name:'消息',exact:true}).click();await page.waitForSelector('.threads')
      await screenshot('messages-dark')
      await page.getByRole('link',{name:'朋友',exact:true}).click();await page.waitForSelector('.friend-window')
      await screenshot('home-dark')
    })
    await test('contract controls and cancellation', async () => {
      await page.goto(`${origin}/friend/lin`)
      await page.getByRole('button',{name:'暂停约定',exact:true}).click()
      await expect(page.getByText('已暂停',{exact:true})).toBeVisible()
      await page.getByRole('button',{name:'恢复约定',exact:true}).click()
      await page.getByRole('button',{name:'好友选项'}).click()
      await page.getByRole('button',{name:'关闭',exact:true}).click()
      const data = await page.evaluate(()=>JSON.parse(localStorage.getItem('daytwo-state-v1')))
      assert.equal(data.relations.find(r=>r.personId==='lin').status,'active')
      await screenshot('friend')
    })
    await test('small phone and desktop layouts', async () => {
      for (const width of [320,430,1440]) {
        await page.setViewportSize({width,height:900})
        await page.goto(`${origin}/home`)
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
        await screenshot(`home-${width}`)
      }
    })
    assert.deepEqual(errors,[])
    results.push({engine,name:'browser errors',status:'passed'})
  } catch(error) {
    results.push({engine,status:'failed',error:String(error),browserErrors:errors,consoleErrors})
    await screenshot('failure');await writeFile(`${out}/${engine}-failure.html`,await page.content());await writeFile(`${out}/${engine}-failure-url.txt`,page.url())
    await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
    throw error
  } finally {await browser.close()}
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
console.log(`Verified ${results.length} checks`)
