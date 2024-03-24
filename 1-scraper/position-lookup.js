const STATE = 'wa';
const COUNTY = 'king'; // in future iterations, there may be multiple counties

/**
 * Calls various functions to determine position fields
 * @param {string} positionText
 * @return {Object} all position fields or null if none
 */
function fetchTuple(positionText) {
  const rawText = positionText.toLowerCase();
  console.log(rawText);

  // This value will be converted to an integer in a later program
  const boundaryAndTitle = getBoundaryAndTitle(rawText);
  // null titles will result in unsupported/null contests, which are ignored
  if (boundaryAndTitle === null) return null;
  // otherwise we will set the boundary and title
  const boundary = boundaryAndTitle[0];
  const title = boundaryAndTitle[1];

  const areaName = getAreaName(rawText, title);
  const districtChar = getDistrictChar(rawText, boundary, title);
  const positionChar = getPositionChar(rawText, boundary, title);
  return {
    boundary_type: boundary,
    title_string: title,
    area_name: areaName,
    district_char: districtChar,
    position_char: positionChar,
  };
}

/**
 * gets the boundary and title string
 * @param {string} s
 * @return {string|null}
 * returns [boundary_type, title_string]
 */
function getBoundaryAndTitle(s) {
  s = s.replace(/-/g, ' ');
  // Excludes special districts
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
    // Senate
  } else if (s.includes('state senate')) {
    return ['state legislature', 'state senate'];
    // House of Representatives
  } else if (s.includes('state representative')) {
    return ['state legislature', 'state house of representatives'];
    // County Assessor
  } else if (s.includes('county') && s.includes('assessor')) {
    return ['county', 'county assessor'];
    // County Auditor
  } else if (s.includes('county') && s.includes('auditor')) {
    return ['county', 'county auditor'];
    // County Commissioner
  } else if (s.includes('county') && s.includes('commissioner')) {
    return ['county', 'county commissioner'];
    // County Council AT LARGE (the difference is in the boundary type)
  } else if (s.includes('county') &&
    s.includes('council') && s.includes('at large')) {
    return ['county', 'county council'];
    // County Director
  } else if (s.includes('county') &&
    s.includes('director') && s.includes('election')) {
    return ['county', 'county director of elections'];
    // County Executive
  } else if (s.includes('county') && s.includes('executive')) {
    return ['county', 'county executive'];
    // County Prosecuting Attorney
  } else if (s.includes('county') &&
    s.includes('prosecuting') && s.includes('attorney')) {
    return ['county', 'county prosecuting attorney'];
    // County Sheriff
  } else if (s.includes('county') && s.includes('sheriff')) {
    return ['county', 'county sheriff'];
    // County Treasurer
  } else if (s.includes('county') && s.includes('treasurer')) {
    return ['county', 'county treasurer'];
    // Port Commissioner TODO: BUG HERE!
  } else if (s.includes('port') &&
    s.includes('commissioner') && s.includes('position')) {
    return ['port', 'port commissioner'];
    // County Council (NOT at large position; difference is boundary!)
  } else if (s.includes('county') &&
    s.includes('council') && !s.includes('at large')) {
    return ['county council', 'county council'];
    // School District director
  } else if (s.includes('school') &&
    (s.includes('district') || s.includes('director'))) {
    return ['school district', 'school district director'];
    // City Council (AT LARGE)
  } else if ((s.includes('city') || s.includes('town')) &&
    s.includes('council') && (s.includes('at large') ||
      s.includes('position'))) {
    return ['city', 'city council'];
    // Mayor
  } else if (s.includes('mayor')) {
    return ['city', 'mayor'];
    // City Attorney
  } else if ((s.includes('city') || s.includes('town')) &&
    s.includes('attorney')) {
    return ['city', 'city attorney'];
    // City Treasurer
  } else if ((s.includes('city') || s.includes('town')) &&
    s.includes('treasurer')) {
    return ['city', 'city treasurer'];
    // City Council (NOT AT LARGE)
  } else if ((s.includes('city') || s.includes('town')) &&
    s.includes('council') && !s.includes('at large')) {
    return ['city council', 'city council'];
    // Unsupported title. We should try to handle this!
  } else {
    console.log('WARNING: Unsupported TITLE passed in');
  }
  return null;
}

/**
 * returns a the district character
 * @param {string} s
 * @param {string} b
 * @param {string} t
 * @return {char|null} positionChar
 */
function getDistrictChar(s, b, t) {
  // titles that don't have districts are null
  let match = null;
  let districtChar = null;
  if (t === 'city council' && b === 'city council') {
    match = s.match(/(?:district no.|district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No district for city council found');
  } else if (t === 'school district director') {
    match = s.match(/(?:district no.|district)\s+(.*?)(?:,|\s+|$)/i);
    districtChar = match ? match[1] : null;
    if (districtChar) return districtChar;
    console.error('ERROR: No district for school district director found');
  } else if (t === 'county council' && b === 'county council') {
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
 * @param {string} b
 * @param {string} t
 * @return {char|null} positionChar
 */
function getPositionChar(s, b, t) {
  let match = null;
  let positionChar = null;
  if (t === 'city council' && b === 'city') {
    match = s.match(/(?:position no.|position)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error('ERROR: No (at large) position for city council found');
  } else if (t === 'school district director') {
    match = s.match(/(?:director district no.|director district|director position no.|director position|director dist.)\s+(.*?)(?:,|\s+|$)/i); // TODO: concatonate strings here
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error(
      'ERROR: No director district position for school district found');
  } else if (t === 'county council' && b === 'county') {
    match = s.match(/(?:position no.|position)\s+(.*?)(?:,|\s+|$)/i);
    positionChar = match ? match[1] : null;
    if (positionChar) return positionChar;
    console.error('ERROR: No (at large) position for county council found');
  } else if (t === 'port commissioner') {
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
 * @return {string|null} areaName
 */
function getAreaName(s, t) {
  let match = null;
  let areaName = null;
  if (t.includes('city') || t === 'mayor' ||
    t === 'port commissioner') {
    match = s.match(/(?:city|town|port)\s+of\s+(.*?)(?:,| commissioner|$)/i);
    areaName = match ? match[1] : null;
    if (areaName) return areaName;
    console.error('ERROR looking up city/town/port area');
  } else if (t === 'school district director') {
    match = s.match(/(?:school)(.*?)(?:school)/i);
    areaName = match ? match[1] : null;
    if (areaName) return areaName.trim();
    console.error('ERROR looking up school district area: ' + areaName);
  } else if (t.includes('county')) {
    return COUNTY;
  } else if (t.includes('state')) {
    return STATE;
  } else {
    console.log('WARNING: Unsupported AREA passed in');
  }
  return null;
}

module.exports = { fetchTuple };
