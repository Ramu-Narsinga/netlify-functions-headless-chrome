const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

exports.handler = async (event, context, callback) => {
  let theTitle = null
  let browser = null
  console.log('spawning chrome headless')
  try {
    const executablePath = await chromium.executablePath

    console.log("about to laucnh chrome with url", event.queryStringParameters);

    // setup
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    })

    // Do stuff with headless chrome
    const page = await browser.newPage()
    let targetUrl = event.queryStringParameters.url;

    if (!targetUrl)
      targetUrl = 'https://docsie.io';

    // console.log("about to visit the url", targetUrl);

    // Goto page and then do stuff
    // await page.goto(targetUrl, {
    //   waitUntil: ["domcontentloaded", "networkidle0"]
    // })

    console.log("about to set content and preparing for screenshot");

    await page.setContent('<html><head><title>HTML Content Set</title></head><body>This is a body with html content only</body></html>', {waitUntil: 'networkidle0'});

    // await page.waitForSelector('#phenomic')
    // ___gatsby

    theTitle = await page.title();

    console.log('done on page', theTitle)

    const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg' });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        title: theTitle,
        message: `Complete screenshot of ${targetUrl}`,
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