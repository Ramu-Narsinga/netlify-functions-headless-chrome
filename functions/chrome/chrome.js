const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

exports.handler = async (event, context, callback) => {
  let theTitle = null
  let browser = null
  console.log('spawning chrome headless')
  let headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Methods': '*',
    "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
    'Access-Control-Allow-Credentials': 'true',
  }
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return { 
        statusCode: 405, 
        // headers: {
        //   'Access-Control-Allow-Origin': '*',
        //   'Access-Control-Allow-Credentials': true,
        // },
        headers,
        body: "Method Not Allowed" 
      };
    }

    const params = JSON.parse(event.body);
    let targetUrl = params.url;
    let domContent = params.domContent ? 
                      decodeURIComponent(params.domContent) : 
                      "<html><head></head><body>Please pass DOM content as part of query params</body></html>";


    const executablePath = await chromium.executablePath

    console.log("about to laucnh chrome with url", params);

    // setup
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    })

    // Do stuff with headless chrome
    const page = await browser.newPage()
    
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
      status: "ok",
      // headers: {
      //   'Access-Control-Allow-Origin': '*',
      //   'Access-Control-Allow-Credentials': true,
      // },
      headers,
      body: JSON.stringify(
        // {
        // title: theTitle,
        // message: `Complete screenshot of ${targetUrl}`,
        // buffer: screenshot

      // }
      params
      )
    })

  } catch (error) {
    console.log('error', error)
    return callback(null, {
      statusCode: 500,
      status: "ok",
      // headers: {
      //   'Access-Control-Allow-Origin': '*',
      //   'Access-Control-Allow-Credentials': true,
      // },
      headers,
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