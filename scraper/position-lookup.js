const STATE = 'wa';
const COUNTY = 'king'; // in future iterations, there may be multiple counties

/**
 * Calls various functions to determine position fields
 * @param {string} positionText
 * @param {number} electionId
 * @return {Object} all position fields or null if none
 */
function fetchTuple(positionText, electionId) {
  const s = positionText.toLowerCase();
  console.log(s);

  // This value will be converted to an integer in a later program
  const titleString = getTitle(s);

  // null titles will result in unsupported/null contests, which are ignored
  if (titleString === null) return null;
  const positionChar = getPositionChar(s, titleString);
  const districtChar = getDistrictChar(s, titleString);
  const areaName = getAreaName(s, titleString, positionChar, districtChar);
  return {
    election_id: electionId,
    title_string: titleString,
    area_name: areaName,
    district_char: districtChar,
    position_char: positionChar,
  };
}

/**
 * gets the title of a titleString
 * @param {string} s
 * @return {string|null} title
 */
function getTitle(s) {
  s = s.replace(/-/g, ' ');
  if ((s.includes('water') ||
      s.includes('fire') ||
      s.includes('sewer') ||
      s.includes('hospital') ||
      s.includes('sewer') ||
      s.includes('utility') ||
      s.includes('airport') ||
      s.includes('cemetery') ||
      s.includes('park')) &&
      s.includes('commissioner')) {
    return null;
  } else if (s.includes('state senate')) {
    return 'state senate';
  } else if (s.includes('state representative')) {
    return 'state house of representatives';
  } else if (s.includes('county') && s.includes('assessor')) {
    return 'county assessor';
  } else if (s.includes('county') && s.includes('auditor')) {
    return 'county auditor';
  } else if (s.includes('county') && s.includes('commissioner')) {
    return 'county commissioner';
  } else if (s.includes('county') &&
        s.includes('council') && s.includes('at large')) {
    return 'county council (at large)';
  } else if (s.includes('county') &&
        s.includes('director') && s.includes('election')) {
    return 'county director of elections';
  } else if (s.includes('county') && s.includes('executive')) {
    return 'county executive';
  } else if (s.includes('county') &&
        s.includes('prosecuting') && s.includes('attorney')) {
    return 'county prosecuting attorney';
  } else if (s.includes('county') && s.includes('sheriff')) {
    return 'county sheriff';
  } else if (s.includes('county') && s.includes('treasurer')) {
    return 'county treasurer';
  } else if (s.includes('port') &&
        s.includes('commissioner') && s.includes('position')) {
    return 'port commissioner (at large)';
  } else if (s.includes('county') &&
        s.includes('council') && !s.includes('at large')) {
    return 'county council';
  } else if (s.includes('school') &&
        (s.includes('district') || s.includes('director'))) {
    return 'school district director';
  } else if ((s.includes('city') || s.includes('town')) &&
        s.includes('council') &&(s.includes('at large') ||
        s.includes('position'))) {
    return 'city council (at large)';
  } else if (s.includes('mayor')) {
    return 'mayor';
  } else if ((s.includes('city') || s.includes('town')) &&
        s.includes('attorney')) {
    return 'city attorney';
  } else if ((s.includes('city') || s.includes('town')) &&
        s.includes('treasurer')) {
    return 'city treasurer';
  } else if ((s.includes('city') || s.includes('town')) &&
        s.includes('council') && !s.includes('at large')) {
    return 'city council';
  } else {
    // TODO: implement port commissioner
    console.log('WARNING: Unsupported TITLE passed in');
  }
  return null;
}

/**
 * returns a the district character
 * @param {string} s
 * @param {string} t
 * @return {char|null} positionChar
 */
function getDistrictChar(s, t) {
  // titles that don't have districts are null
  let match = null;
  let districtChar = null;
  if (t === 'city council') {
    match = s.match(/(?:district no.|district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No district for city council found');
  } else if (t === 'school district director') {
    match = s.match(/(?:district no.|district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No district for school district director found');
  } else if (t === 'county council') {
    match = s.match(/(?:district no.|district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No district for county council found');
  } else if (t.includes('state')) {
    match = s.match(/(?:district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No state rep district found');
  }
  return null;
}

// can be a number or a letter (char)
/**
 * returns a position character
 * @param {string} s
 * @param {string} t
 * @return {char|null} positionChar
 */
function getPositionChar(s, t) {
  let match = null;
  let positionChar = null;
  if (t === 'city council (at large)') {
    match = s.match(/(?:position no.|position)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error('ERROR: No (at large) position for city council found');
  } else if (t === 'school district director') {
    match = s.match(/(?:director district no.|director district|director position no.|director position|director dist.)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error(
        'ERROR: No director district position for school district found');
  } else if (t === 'county council (at large)') {
    match = s.match(/(?:position no.|position)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error('ERROR: No (at large) position for county council found');
  } else if (t === 'port commissioner (at large)') {
    match = s.match(/(?:position no.|position)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error('ERROR: No at large position for port commissioner found');
  }
  return null;
}

/**
 * gets the area name
 * @param {string} s
 * @param {string} t
 * @param {char|null} p
 * @param {char|null} d
 * @return {string|null} areaName
 */
function getAreaName(s, t, p, d) {
  let match = null;
  let areaName = null;
  if (t.includes('city') || t === 'mayor' ||
      t === 'port commissioner (at large)') {
    match = s.match(/(?:city|town|port)\s+of\s+(.*?)(?:,|$)/i);
    areaName = match ? match[1] : null;
    if (areaName) return areaName;
    console.error('ERROR looking up city/town/port area');
  } else if (t === 'school district director') {
    match = s.match(/(.*?)(?:\s*school|\s*district|$)/i);
    areaName = match ? match[1] : null;
    if (areaName) return areaName;
    console.error('ERROR looking up school district area');
  } else if (t.includes('county')) {
    return COUNTY;
  } else if (t === 'state') {
    return STATE;
  } else {
    console.log('WARNING: Unsupported AREA passed in');
  }
  return null;
}

module.exports = {fetchTuple};
