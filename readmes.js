const axios = require('axios');
const marked = require('marked');
const config = require('./config.js');
const db = require('./dbhelpers.js');

//FILL IN THE NUMBER OF DESIRED STARS YOU WOULD LIKE TO SEARCH FOR:
const desiredStars = 50;
// ===============================================================



//Find first range
//Start getting the readmes for that range
//Concurrently, find the second range

// var ranges = db.ranges.desiredStars.toString() ? db.ranges.desiredStars.toString() : establishRanges([], 8800);


  // axios({
  //   method:'get',
  //   url:`https://api.github.com/search/repositories?q=stars:50..4395&per_page=100`,
  //   headers: {
  //     Accept: 'application/vnd.github.v3+json',
  //     Authorization: config.apiKey
  //   }
  // })
  // .then(response => console.log(response))
  // .catch(err => console.log(err.message))


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


// FETCH GITHUB READMES
function fetchMeta(stars) {
  axios({
    method:'get',
    url:`https://api.github.com/search/repositories?q=stars:${range}&per_page=100`,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: config.apiKey
    }
  })
  .then(function(response) {
    if(response.data.total_count < 1000) {
      grabEntries(response);
    } else {
      stars = stars + 50;
      console.log('stars: ', stars)
      fetchMeta(stars)
      while(stars > desiredStars) {
        fetchMeta()
      }
    }
  });
}


function callNext(next) {
  axios(next)
  .then(response => {
    axios({
      method:'get',
      url:`https://api.github.com/rate_limit`,
      headers: {Authorization: config.apiKey},
    })
    .then(res => {
    })
    return response;
  })
  .then(res => grabEntries(res))
  .catch(err => {
    console.log('------waiting for rate limit reset --------')
    setTimeout(callNext, 30000, next)
  })
}

async function setObject(repo, i, arr) {
  return new Promise((resolve, reject) => {
    axios({
      method:'get',
      url:`https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/README.md`,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: config.apiKey
      },
    })
    .then(result => {
      let buff = new Buffer(result.data.content, 'base64')
      let text = buff.toString('ascii')
      let html = marked(text);
      let entry = {
        title: repo.name,
        description: repo.description,
        content: html,
      }
      // INSERT READMES IN DATABSE
      setTimeout(db.addArticle, 100, entry, (success) => console.log(success))
    })
    .then(() => {
      resolve('success')
    })
    .catch(err => {
      console.log('there was an error fetching the readme: ', err)
      resolve('error')
    })
  });
}


function grabEntries(response) {
  let allEntries = [];
  let nextUrl, nextPg, currentPg, lastUrl, lastPg;
  console.log('++++++++++++response.headers.link+++++++++++++: ', response.headers.link)
  let lastGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"last\"'))[0];
  if(lastGroup) {
    lastUrl = lastGroup.match(/\<(.*)\>\;\s*rel=\"last\"/)[1];
    lastPg = lastUrl.match(/&page=(\d*)/)[1];
    let nextGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"next\"'))[0];
    nextUrl = nextGroup.match(/\<(.*)\>\;\s*rel=\"next\"/)[1]
    nextPg = nextUrl.match(/&page=(\d*)/)[1]
    currentPg = nextPg - 1;
    console.log('------currentPg------', currentPg, ' of ', lastPg)
  }
  // GRAB NEXT PAGE OF API RESULTS
  Promise.all(response.data.items.map(setObject))
  .then((info) => {
    if(nextUrl) {
      callNext(nextUrl)
    } else {
      console.log('done!')
    }
  })
  .catch(err => {
    console.error(err.message)
  })
}

establishRanges(['254..257'], 253);
// establishRanges(50000);
