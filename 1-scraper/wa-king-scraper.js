'use strict';
const puppeteer = require('puppeteer');
const { fetchTuple } = require('./position-lookup.js');
const fs = require('fs');

// TODO: In future iterations, this should not be hardcoded,
// but manually inputted
// const ELECTION_NUMBER = '39';

// TODO: in future iterations, we'd like to use the following url pattern
// https://voter.votewa.gov/GenericVoterGuide.aspx?e=?&c=?#/
const BASE_URL = 'https://info.kingcounty.gov/kcelections/Vote/contests/';
const PRIMARY = 'candidates.aspx?eid=38';
const GENERAL = 'candidates.aspx?eid=39';

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
    const primaryData = await scrapeHomePage(PRIMARY);
    const generalData = await scrapeHomePage(GENERAL);
    // This is used purely for testing purposes
    // in the relational model, we expect this to be different!
    const electionSet = [
      {
        'election_id': 1,
        'election_type': 'primary',
        'voting_start': 20230714,
        'register_by': 20230724,
        'voting_end': 20230801,
        'contests': primaryData,
      },
      {
        'election_id': 2,
        'election_type': 'general',
        'voting_start': 20231020,
        'register_by': 20231030,
        'voting_end': 20231107,
        'contests': generalData,
      },
      {
        'election_id': 3,
        'election_type': 'primary',
        'voting_start': 20240719,
        'register_by': 20240729,
        'voting_end': 20240806,
        'contests': [],
      },
    ];
    saveDataToJson(electionSet);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Initiates the scrape of the home page
 * @param {string} electionExtension The URL of the home page to scrape.
 * @return {Promise<void>} Nothing
 */
async function scrapeHomePage(electionExtension) {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // allows for in-terminal debugging
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(BASE_URL + electionExtension);

    const contestData = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.candidatelist-div'))
        .map((div) => ({ // TODO: Grab active
          position_info: div.parentElement.querySelector('.active').textContent.trim() + " " + div.querySelector('.list-group-item-heading').textContent.trim(),
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
      );
      // Pushes to a new array of all the candidates that we aren't processing
      // before updating the candidate information as well
      // TODO: Implement counter
      if (contestData[i].position_info !== null) {
        contestData[i].candidate_info = await scrapeCandidateData(
          browser,
          BASE_URL + contestData[i].candidate_info[0].url,
        );
        newContestData.push(contestData[i]);
      }
    }

    // console.log(JSON.stringify(newContestData, null, 2));
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

        candidateData['image'] = candidate
          .querySelector('.candy-img-div img')?.src || null;

        candidateData['email'] = candidate
          .querySelector('.pmph-email span a')?.textContent.trim() || null;

        // Safely attempt to get the candidate's website
        candidateData['website'] = candidate
          .querySelector('.pmph-web span a')?.textContent.trim() || null;

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

        candidateData['pfms'] = [];

        candidateData['politigram_quotes'] = [];

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
