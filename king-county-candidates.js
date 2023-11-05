"use strict";
const puppeteer = require('puppeteer');
const fs = require('fs');

const SCRAPE_URL = 'https://info.kingcounty.gov/kcelections/Vote/contests/candidates.aspx';

let candJson;

const main = async () => {
  await scrape();
};

// .candidatelist-div
//

async function scrape() {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    console.log("/!\\ Starting scrape /!\\");

    // Modify constant to search snb/ski and number of products scraped
    await page.goto(SCRAPE_URL);
    console.log(`/!\\ Going to ${SCRAPE_URL} /!\\`);

    // const groups = groupTags.map(group => {
    //     const groupTags = Array.from(document.querySelectorAll('.candidate-list-group'));
    //     const groupName = groupTags.querySelector("h4").textContent.trim();
    //     candJson[groupName] = { };
    //     const candDivs = groupTags.querySelectorAll(".candidatelist-div")

    //     groupName
    //     console.log(`Inside page.evaluate(): ${h4Text}`);
    //     return h4Text;});


    // console.log(groups)
    const candidateData = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('.list-group.candidate-list-group'));
      const data = {};

      groups.forEach(group => {
        const groupName = group.querySelector('.list-group-item.active h4').textContent.trim();
        const candDivs = Array.from(group.querySelectorAll("candidatelist-div"));

        const candidates = Array.from(group.querySelectorAll('.candidate-anchor'));
        const candidateInfo = candidates.map(candidate => {
          const candidateName = candidate.querySelector('.ballotname').textContent;
          const candidateUrl = candidate.getAttribute('href');
          return { name: candidateName, url: candidateUrl };
        });
        data[groupName] = candidateInfo;
      });

      return data;
    });

  console.log('Candidate Data:', candidateData);
    // Scrapes products subpages
    // for (const candidate of candidates) {

    //   console.log(`Starting ${candidate['url']}...`);

    //   // Interval between subpage requests
    //   await new Promise(resolve => setTimeout(resolve, 2500));
    //   await page.goto(url);
    //   // !!! Uncomment code to change schema for ski/snb !!!
    //   await page.evaluate(() => {


    //     console.log("Completed")
    //     return data;
    //   });
    // };
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
    // fs.writeFileSync('data/productData.json', JSON.stringify(productData, null, 2));
    // console.log("/!\\ Done /!\\")
  }
}

main();
