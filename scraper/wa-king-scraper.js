'use strict';
const puppeteer = require('puppeteer');
const {fetchTuple} = require('./position-lookup.js');
const fs = require('fs');

// TODO: In future iterations, this should not be hardcoded,
// but manually inputted
const ELECTION_NUMBER = 2;

// TODO: in future iterations, we'd like to use the following url pattern
// https://voter.votewa.gov/GenericVoterGuide.aspx?e=?&c=?#/
const BASE_URL = 'https://info.kingcounty.gov/kcelections/Vote/contests/';
const HOME_URL = BASE_URL + 'candidates.aspx';

// TODO: if there is a candidate with a missing statement,
// we are going to have to do additional research
// let missingCandidateStatements = 0;

// TODO: we may be able to access their website and scrape from that,
// but if a website doesn't exist we are going to need to do additional
// research to find information on the candidate
// if there is an empty value in this array
// let missingWebsiteAndCandidateStatements = [];

const main = async () => {
  try {
    const contestData = await scrapeHomePage();
    saveDataToJson(contestData);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Initiates the scrape of the home page
 * @return {Promise<void>} Nothing
 */
async function scrapeHomePage() {
  const browser = await puppeteer.launch({headless: 'new'});
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // allows for in-terminal debugging
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(HOME_URL);

    // this gets contest position and url data from the scrape
    // calls Position_Lookup.fetchTuple to get the position data
    const contestData = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.candidatelist-div'))
          .map((div) => ({
            position_info: div
                .querySelector('.list-group-item-heading')
                .textContent.trim(),
            candidate_info: Array
                .from(div.querySelectorAll('.candidate-anchor'))
                .map((candidate) => ({
                  name: candidate.querySelector('.ballotname').textContent,
                  url: candidate.getAttribute('href'),
                })),
          })),
    );

    // This new array will hold the modified proper position info
    const newContestData = [];

    // Overwrites candidate information with proper values for PFM calculation
    const contestsLen = contestData.length;
    // You can modify loop bounds to test specific chunks of data
    for (let i = 0; i < contestsLen; i++) {
      contestData[i].position_info = fetchTuple(
          contestData[i].position_info,
          ELECTION_NUMBER,
      );
      // Pushes to a new array of all the candidates that we aren't processing
      // before updating the candidate information as well
      // TODO: Implement counter
      if (contestData[i].position_info !== null) {
        contestData[i].candidate_info = await scrapeCandidateData(
            browser,
            BASE_URL + contestData[i].candidate_info[0].url
        );
        newContestData.push(contestData[i]);
      }
    }

    return newContestData;
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrapes the individual candidate data pages
 * @param {*} browser
 * @param {*} candidateUrl
 * @return {Promise<void>} Nothing
 */
async function scrapeCandidateData(browser, candidateUrl) {
  let page;
  try {
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto(candidateUrl);

    const candidateData = await page.evaluate(() => {
      const candidates = Array
          .from(document.querySelectorAll('.pmph-landing-div'));
      const result = [];
      candidates.forEach((candidate) => {
        const candidateData = {};

        // Safely attempt to get the candidate's name
        candidateData['name'] = candidate
            .querySelector('.pmph-cname')?.textContent.trim() || null;

        // Safely attempt to get the candidate's website
        const websiteText = candidate
            .querySelector('.pmph-web span a')?.textContent.trim() || null;
        candidateData['website'] = websiteText;

        // attempt to get the candidate's educational background
        // uses default value for no-info as outlined in the voter pamphlet
        candidateData['education'] = candidate
            .querySelector('.education')?.textContent.trim() ||
            'No information submitted';

        // attempt to get the candidate's occupation
        // uses default value for no-info as outlined in the voter pamphlet
        candidateData['occupation'] = candidate
            .querySelector('.occupation')?.textContent.trim() ||
            'No information submitted';

        // attempt to get the candidate's statement
        // uses default value for no-info as outlined in the voter pamphlet
        let statementText = candidate
            .querySelector('.statement-div')?.textContent.trim() ||
            'No statement submitted';
        statementText = statementText ? statementText
            .replace(/Statement: |\n+/g, '') : null;
        candidateData['statement'] = statementText;

        if (statementText === 'No statement submitted') {
          candidateData['statement_source'] = null;
        } else {
          candidateData['statement_source'] = 'King County voter pamphlet';
        }

        // now push all the candidate data as one candidate
        result.push(candidateData);
      });
      return result;
    });

    return candidateData;
  } catch (error) {
    console.error(error);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * saves the data to a JSON file
 * @param {*} data
 */
function saveDataToJson(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile('contestData.json', jsonData, (err) => {
    if (err) {
      console.error('Error saving JSON file:', err);
    } else {
      console.log('Data saved to contestData.json');
    }
  });
}

main();
