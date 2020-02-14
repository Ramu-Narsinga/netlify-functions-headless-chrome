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
    let domContent = event.queryStringParameters.domContent ? 
                      decodeURIComponent(event.queryStringParameters.domContent) : 
                      "<html><head></head><body>Please pass DOM content as part of query params</body></html>";

    if (targetUrl) {
      // targetUrl = 'https://docsie.io';
      console.log("about to visit the url", targetUrl);
      // Goto page and then do stuff
      await page.goto(targetUrl, {
        waitUntil: ["domcontentloaded", "networkidle0"]
      })

      targetUrl = "";
    } else {
      console.log("about to set content and preparing for screenshot");
      await page.setContent(domContent, {waitUntil: 'networkidle0'});

      domContent = "";
    }

    theTitle = await page.title();

    console.log('done on page', theTitle)

    const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg' });

    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
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