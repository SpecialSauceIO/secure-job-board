export interface UsStateOption {
  code: string
  name: string
  metros: string[]
}

export const US_REMOTE_REGIONS = [
  'Remote — US Nationwide',
  'Remote — Eastern Time (EST)',
  'Remote — Central Time (CST)',
  'Remote — Mountain Time (MST)',
  'Remote — Pacific Time (PST)',
]

export const US_STATES_AND_METROS: UsStateOption[] = [
  { code: 'AL', name: 'Alabama', metros: ['Birmingham-Hoover Metro', 'Huntsville Metro', 'Mobile', 'Montgomery', 'Tuscaloosa'] },
  { code: 'AK', name: 'Alaska', metros: ['Anchorage Metro', 'Fairbanks', 'Juneau'] },
  { code: 'AZ', name: 'Arizona', metros: ['Phoenix-Mesa-Scottsdale Metro', 'Tucson Metro', 'Flagstaff', 'Prescott', 'Yuma'] },
  { code: 'AR', name: 'Arkansas', metros: ['Little Rock-North Little Rock Metro', 'Fayetteville-Springdale-Rogers (NWA)', 'Fort Smith', 'Jonesboro'] },
  { code: 'CA', name: 'California', metros: ['San Francisco Bay Area / Silicon Valley', 'Los Angeles-Long Beach-Anaheim Metro', 'San Diego-Chula Vista Metro', 'Sacramento-Roseville Metro', 'Inland Empire (Riverside-San Bernardino)', 'Fresno', 'Santa Barbara', 'Bakersfield'] },
  { code: 'CO', name: 'Colorado', metros: ['Denver-Aurora-Lakewood Metro', 'Boulder', 'Colorado Springs', 'Fort Collins', 'Grand Junction'] },
  { code: 'CT', name: 'Connecticut', metros: ['Hartford-East Hartford Metro', 'Stamford-Bridgeport-Norwalk', 'New Haven', 'New London'] },
  { code: 'DE', name: 'Delaware', metros: ['Wilmington', 'Dover', 'Newark'] },
  { code: 'DC', name: 'District of Columbia', metros: ['Washington, D.C. / DMV Metro'] },
  { code: 'FL', name: 'Florida', metros: ['Miami-Fort Lauderdale-West Palm Beach', 'Tampa-St. Petersburg-Clearwater', 'Orlando-Kissimmee-Sanford', 'Jacksonville Metro', 'Sarasota-Bradenton', 'Fort Myers-Naples', 'Tallahassee', 'Gainesville', 'Pensacola'] },
  { code: 'GA', name: 'Georgia', metros: ['Atlanta-Sandy Springs-Alpharetta Metro', 'Savannah', 'Augusta', 'Columbus', 'Athens', 'Macon'] },
  { code: 'HI', name: 'Hawaii', metros: ['Honolulu / Oahu', 'Maui', 'Kona / Hawaii Island', 'Kauai'] },
  { code: 'ID', name: 'Idaho', metros: ['Boise City-Nampa Metro', 'Coeur d’Alene', 'Idaho Falls', 'Pocatello'] },
  { code: 'IL', name: 'Illinois', metros: ['Chicago-Naperville-Elgin Metro', 'Champaign-Urbana', 'Springfield', 'Peoria', 'Rockford', 'Bloomington-Normal'] },
  { code: 'IN', name: 'Indiana', metros: ['Indianapolis-Carmel-Anderson Metro', 'Fort Wayne', 'South Bend-Mishawaka', 'Bloomington', 'Evansville', 'Lafayette'] },
  { code: 'IA', name: 'Iowa', metros: ['Des Moines-West Des Moines Metro', 'Cedar Rapids', 'Iowa City', 'Davenport / Quad Cities', 'Ames'] },
  { code: 'KS', name: 'Kansas', metros: ['Kansas City Overland Park / Olathe', 'Wichita Metro', 'Topeka', 'Lawrence', 'Manhattan'] },
  { code: 'KY', name: 'Kentucky', metros: ['Louisville / Jefferson County Metro', 'Lexington-Fayette', 'Northern Kentucky (Cincinnati Metro)', 'Bowling Green'] },
  { code: 'LA', name: 'Louisiana', metros: ['New Orleans-Metairie Metro', 'Baton Rouge', 'Shreveport-Bossier City', 'Lafayette', 'Lake Charles'] },
  { code: 'ME', name: 'Maine', metros: ['Portland-South Portland', 'Bangor', 'Augusta', 'Lewiston-Auburn'] },
  { code: 'MD', name: 'Maryland', metros: ['Baltimore-Columbia-Towson Metro', 'Bethesda-Rockville-Frederick (DMV)', 'Annapolis', 'Salisbury'] },
  { code: 'MA', name: 'Massachusetts', metros: ['Boston-Cambridge-Newton Metro', 'Worcester', 'Springfield', 'Lowell', 'Cape Cod'] },
  { code: 'MI', name: 'Michigan', metros: ['Detroit-Warren-Dearborn Metro', 'Ann Arbor', 'Grand Rapids-Kentwood', 'Lansing-East Lansing', 'Kalamazoo', 'Traverse City'] },
  { code: 'MN', name: 'Minnesota', metros: ['Minneapolis-St. Paul-Bloomington Metro', 'Rochester', 'Duluth', 'St. Cloud', 'Mankato'] },
  { code: 'MS', name: 'Mississippi', metros: ['Jackson Metro', 'Gulfport-Biloxi', 'Hattiesburg', 'Oxford', 'Tupelo'] },
  { code: 'MO', name: 'Missouri', metros: ['St. Louis Metro', 'Kansas City Metro', 'Springfield', 'Columbia', 'Jefferson City'] },
  { code: 'MT', name: 'Montana', metros: ['Bozeman', 'Missoula', 'Billings', 'Helena', 'Kalispell'] },
  { code: 'NE', name: 'Nebraska', metros: ['Omaha-Council Bluffs Metro', 'Lincoln', 'Grand Island', 'Kearney'] },
  { code: 'NV', name: 'Nevada', metros: ['Las Vegas-Henderson-Paradise Metro', 'Reno-Sparks-Tahoe', 'Carson City'] },
  { code: 'NH', name: 'New Hampshire', metros: ['Manchester-Nashua', 'Portsmouth / Seacoast', 'Concord', 'Hanover-Lebanon'] },
  { code: 'NJ', name: 'New Jersey', metros: ['Jersey City-Newark-Hoboken (NYC Metro)', 'Princeton-Trenton', 'Morristown-Parsippany', 'Cherry Hill-Camden (Philly Metro)', 'Atlantic City'] },
  { code: 'NM', name: 'New Mexico', metros: ['Albuquerque Metro', 'Santa Fe', 'Las Cruces', 'Los Alamos'] },
  { code: 'NY', name: 'New York', metros: ['New York City (5 Boroughs)', 'Long Island (Nassau-Suffolk)', 'Westchester / Hudson Valley', 'Buffalo-Cheektowaga Metro', 'Rochester Metro', 'Albany-Schenectady-Troy', 'Syracuse', 'Ithaca'] },
  { code: 'NC', name: 'North Carolina', metros: ['Raleigh-Durham-Chapel Hill (Research Triangle)', 'Charlotte-Concord-Gastonia Metro', 'Greensboro-High Point-Winston-Salem (Piedmont Triad)', 'Asheville', 'Wilmington'] },
  { code: 'ND', name: 'North Dakota', metros: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'] },
  { code: 'OH', name: 'Ohio', metros: ['Columbus Metro', 'Cleveland-Elyria Metro', 'Cincinnati Metro', 'Dayton-Kettering', 'Akron', 'Toledo'] },
  { code: 'OK', name: 'Oklahoma', metros: ['Oklahoma City Metro', 'Tulsa Metro', 'Norman', 'Stillwater'] },
  { code: 'OR', name: 'Oregon', metros: ['Portland-Vancouver-Hillsboro Metro', 'Eugene-Springfield', 'Bend-Redmond', 'Salem', 'Medford'] },
  { code: 'PA', name: 'Pennsylvania', metros: ['Philadelphia-Camden-Wilmington Metro', 'Pittsburgh Metro', 'Allentown-Bethlehem-Easton (Lehigh Valley)', 'Harrisburg-Lancaster-York', 'State College', 'Erie'] },
  { code: 'RI', name: 'Rhode Island', metros: ['Providence-Warwick Metro', 'Newport'] },
  { code: 'SC', name: 'South Carolina', metros: ['Charleston-North Charleston Metro', 'Greenville-Spartanburg-Anderson', 'Columbia Metro', 'Myrtle Beach', 'Hilton Head'] },
  { code: 'SD', name: 'South Dakota', metros: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'] },
  { code: 'TN', name: 'Tennessee', metros: ['Nashville-Davidson-Murfreesboro-Franklin', 'Memphis Metro', 'Knoxville', 'Chattanooga', 'Clarksville', 'Tri-Cities (Johnson City-Kingsport)'] },
  { code: 'TX', name: 'Texas', metros: ['Dallas-Fort Worth-Arlington (DFW Metro)', 'Austin-Round Rock-Georgetown Metro', 'Houston-The Woodlands-Sugar Land Metro', 'San Antonio-New Braunfels Metro', 'El Paso', 'Waco-Temple-Killeen', 'Corpus Christi', 'Lubbock', 'Amarillo', 'Tyler-Longview', 'McAllen-Edinburg'] },
  { code: 'UT', name: 'Utah', metros: ['Salt Lake City Metro', 'Provo-Orem-Lehi (Silicon Slopes)', 'Ogden-Clearfield', 'St. George', 'Park City'] },
  { code: 'VT', name: 'Vermont', metros: ['Burlington-South Burlington', 'Montpelier', 'Rutland'] },
  { code: 'VA', name: 'Virginia', metros: ['Northern Virginia / Tysons-Reston-Arlington (DMV)', 'Richmond Metro', 'Virginia Beach-Norfolk-Newport News (Hampton Roads)', 'Charlottesville', 'Roanoke', 'Blacksburg'] },
  { code: 'WA', name: 'Washington', metros: ['Seattle-Tacoma-Bellevue Metro', 'Spokane-Spokane Valley', 'Vancouver (Portland Metro)', 'Bellingham', 'Olympia-Tumwater', 'Tri-Cities (Kennewick-Richland)'] },
  { code: 'WV', name: 'West Virginia', metros: ['Charleston', 'Morgantown', 'Huntington', 'Martinsburg / Eastern Panhandle'] },
  { code: 'WI', name: 'Wisconsin', metros: ['Milwaukee-Waukesha Metro', 'Madison Metro', 'Green Bay', 'Appleton-Oshkosh', 'Eau Claire', 'La Crosse'] },
  { code: 'WY', name: 'Wyoming', metros: ['Cheyenne', 'Casper', 'Jackson', 'Laramie'] },
]

export function parseLocationString(rawLocation?: string | null): {
  stateCode: string
  metro: string
} {
  const clean = (rawLocation || '').trim()
  if (!clean) return { stateCode: '', metro: '' }

  // Check if it's one of the US Remote Region presets
  if (clean.startsWith('Remote —')) {
    return { stateCode: 'REMOTE_US', metro: clean }
  }

  // Check if it ends with ", XX" (two-letter state code)
  const parts = clean.split(',')
  if (parts.length >= 2) {
    const possibleCode = parts[parts.length - 1].trim().toUpperCase()
    const foundState = US_STATES_AND_METROS.find(s => s.code === possibleCode)
    if (foundState) {
      const metroPart = parts.slice(0, parts.length - 1).join(',').trim()
      const matchedMetro =
        foundState.metros.find(m => m.toLowerCase() === metroPart.toLowerCase()) ||
        foundState.metros.find(m => m.toLowerCase().includes(metroPart.toLowerCase())) ||
        metroPart
      return { stateCode: foundState.code, metro: matchedMetro }
    }
  }

  // Fallback: check if any state name or code is mentioned
  for (const st of US_STATES_AND_METROS) {
    if (
      clean.toLowerCase().includes(st.name.toLowerCase()) ||
      clean.toUpperCase().includes(st.code)
    ) {
      const matchedMetro =
        st.metros.find(m => m.toLowerCase().includes(clean.toLowerCase())) ||
        st.metros[0]
      return { stateCode: st.code, metro: matchedMetro }
    }
  }

  return { stateCode: '', metro: '' }
}