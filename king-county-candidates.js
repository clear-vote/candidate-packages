"use strict";
const puppeteer = require('puppeteer');
const fs = require('fs');

const SCRAPE_URL = 'https://info.kingcounty.gov/kcelections/Vote/contests/candidates.aspx';

let candJson;

const main = async () => {
 saveDataToJson(await scrape());
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

    const candidateData = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('.list-group.candidate-list-group'));
      const data = {};

      groups.forEach(group => {
        const groupName = group.querySelector('.list-group-item.active h4').textContent.trim();
        const candDivs = Array.from(group.querySelectorAll(".candidatelist-div"));
        const divArr =[];
        candDivs.map(div => {
            let position = div.querySelector('h5.list-group-item-heading').textContent.trim();
            const candidates = Array.from(div.querySelectorAll('.candidate-anchor'));
            const candidateInfo = candidates.map(candidate => {
              const candidateName = candidate.querySelector('.ballotname').textContent;
              const candidateUrl = candidate.getAttribute('href');

              return { name: candidateName, url: candidateUrl };
            });
            divArr.push({
              position: position,
              candidates: candidateInfo
            });
        });
        data[groupName] = divArr;
      });

      return data;
    });

  console.log('Candidate Data:', candidateData);
  return candidateData
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

function saveDataToJson(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile('candidateData.json', jsonData, (err) => {
    if (err) {
      console.error('Error saving JSON file:', err);
    } else {
      console.log('Data saved to candidateData.json');
    }
  });
}

main();
