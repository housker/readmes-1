const axios = require('axios');
const marked = require('marked');
const config = require('./config.js');
const db = require('./dbhelpers.js');

//FILL IN THE NUMBER OF DESIRED STARS YOU WOULD LIKE TO SEARCH FOR:
const desiredStars = 50;
// ===============================================================





function establishRanges(ranges, stars, low = desiredStars, high = 301) {
  let currentRange;

  // if(ranges.length < 1) {
  //   currentRange = `>=${Math.round(stars)}`
  // } else {
    high = ranges[ranges.length -1].match(/\d+/)
    console.log('high: ', high);
    currentRange = `${Math.round(low)}..${high}`
  // }
  console.log('currentRange: ', currentRange)
  axios({
    method:'get',
    url:`https://api.github.com/search/repositories?q=stars:${currentRange}&per_page=100`,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: config.apiKey
    }
  })
  .then(function(response) {
    if(response.data.total_count < 1000 && response.data.total_count > 800) {
      console.log('response.data.total_count: ', response.data.total_count)
        ranges.push(currentRange)
        console.log('ranges: ', ranges)
        establishRanges(ranges, desiredStars)
      // ranges.length < 1 ? ranges.push(`>=${stars}`) : `${START_____}..${ranges[ranges.length -1].match(/\d*/)}`
    // } else {
    //   stars = stars + 50;
    //   console.log('stars: ', stars)
    //   fetchMeta(stars)
    //   while(stars > desiredStars) {
    //     fetchMeta()
    //   }
    } else if(response.data.total_count >= 1000) {
      console.log('response.data.total_count', response.data.total_count)
      // console.log('response.data.total_count - 1000) / 1000)', Math.sqrt(response.data.total_count - 1000))
      // stars = stars + (Math.sqrt(response.data.total_count - 1000))
      low = stars;
      stars = stars + (Math.abs(high - stars) / 2);

      // stars = response.data.total_count;
      console.log('stars increasing: ', stars)
      establishRanges(ranges, stars, high);
    } else {
      high = stars;
      stars = stars - (Math.abs(stars - low) / 2)
      // stars = max - stars;
      // stars = stars + 50;
      console.log('stars decreasing: ', stars)
      establishRanges(ranges, stars, high);
    }
  })
  .catch(err => {
    console.log('ranges: ', ranges);
    console.log(err.message)
    setTimeout(establishRanges, 30000, ranges, stars, high)
  })
  return ranges;
}


establishRanges(['254..257'], 253);
// establishRanges(50000);
