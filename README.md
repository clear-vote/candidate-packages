# ClearVote Candidate Package

### Getting started
1. After cloning, run npm install to download dependencies (puppeteer)
2. Configure puppeteer (https://pptr.dev/guides/configuration) you may not need to do this
3. run on 'scraper/wa-king-scraper.js'

### The voter guide
https://voter.votewa.gov/GenericVoterGuide.aspx? has two values that determine what election you are looking at

e=883 is the election period
conveniently, each election period is the same across all counties
most years have 6 to 7 election periods throughout the year, including
1. Primary
2. General
3. Presidential Primary (on presidential election years)
4. Special Elections (which happen for measures, propositions, and to fill vacancies)

c=17 is the county code. Specifically, each county is assigned a FIP code, and this number is divided by 2 and rounded up to get the number for HTML
all uncalculated county codes can be found here: https://en.wikipedia.org/wiki/List_of_counties_in_Washington

eg. https://voter.votewa.gov/GenericVoterGuide.aspx?e=883&c=17#/ is the King County 2023 general election

### What this repo does

1. Reads in candidate data from government websites into a json file
2. for each candidate, it either pairs them with their statement or scrapes the web to compile one for them (this is a stretch feature and not yet implemented)
3. from the JSON file, it makes an openAI call to retrieve political focus metrics for each candidate, given the appropriate pfm set for the position
4. each candidate is written to a csv file corresponding to their position
