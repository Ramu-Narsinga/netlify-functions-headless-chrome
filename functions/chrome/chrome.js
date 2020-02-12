const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

exports.handler = async (event, context, callback) => {
  let theTitle = null
  let browser = null
  console.log('spawning chrome headless')
  try {
    const executablePath = await chromium.executablePath

    console.log("about to laucnh chrome");

    // setup
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    })

    // Do stuff with headless chrome
    const page = await browser.newPage()
    const targetUrl = 'https://docsie.io'

    console.log("about to visit the url", targetUrl);

    // Goto page and then do stuff
    await page.goto(targetUrl, {
      waitUntil: ["domcontentloaded", "networkidle0"]
    })

    // await page.waitForSelector('#phenomic')
    // ___gatsby

    theTitle = await page.title();

    console.log('done on page', theTitle)

    const screenshot = await page.screenshot({ encoding: 'binary' });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        title: theTitle,
        message: `Complete screenshot of ${pageToScreenshot}`,
        buffer: screenshot
      })
    })

  } catch (error) {
    console.log('error', error)
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        error: error
      })
    })
  } finally {
    // close browser
    if (browser !== null) {
      await browser.close()
    }
  }
}