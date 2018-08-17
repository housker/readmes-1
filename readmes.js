const axios = require('axios');
const marked = require('marked');
const config = require('./config.js');
const db = require('./dbhelpers.js');

// FETCH GITHUB READMES
axios({
  method:'get',
  url:'https://api.github.com/search/repositories?q=stars:>=500',
  headers: {Authorization: config.apiKey}
})
.then(function(response) {
  grabEntries(response);
});

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
      headers: {Authorization: config.apiKey},
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
      resolve('error')
    })
  });
}


function grabEntries(response) {
  let allEntries = [];
  let nextUrl, nextPg, currentPg, lastUrl, lastPg;
  let lastGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"last\"'))[0];
  if(lastGroup) {
    lastUrl = lastGroup.match(/\<(.*)\>\;\s*rel=\"last\"/)[1];
    lastPg = lastUrl.match(/page=(\d*)/)[1];
    let nextGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"next\"'))[0];
    nextUrl = nextGroup.match(/\<(.*)\>\;\s*rel=\"next\"/)[1]
    nextPg = nextUrl.match(/page=(\d*)/)[1]
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
