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
  // console.log('response ', response)
  const totalPages = parseInt(response.headers.link.split(',')[1].match(/page=(\d*)/)[1])
  grabEntries(response);
});

function callNext(next) {
  console.log('calling next: ', next)
  axios(next)
  // .then((response) => {
  //   console.log('i bet this is the problem: ', response)
  //   grabEntries(response)
  // })
  .then(response => {
    axios({
      method:'get',
      url:`https://api.github.com/rate_limit`,
      headers: {Authorization: config.apiKey},
    })
    .then(res => {
      // console.log('search rate_limit: ', res.resources.search)
      console.log('core rate_limit: ', res.data.resources)
    })
    return response;

  })
  .then(res => grabEntries(res))
  .catch(err => {
    console.log('an error from this axios is stopping it: ', err)
    setTimeout(callNext, 60010, next)
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

      // console.log('entry.title: ', entry.title)

      // INSERT READMES IN DATABSE
      // db.addArticle(entry, (success) => console.log(success, 'that was the result of inserting'))
      // resolve('success')
    })
    .then(() => {
      console.log('is something preventing a resolve?')
      resolve('success')
    })
    .catch(err => {
      console.log('promise error present')
      resolve('resolving the error')
    })
  });
}


function grabEntries(response) {
  var more = true;
  let allEntries = [];
  let nextUrl, nextPg, currentPg, lastUrl, lastPg;
  console.log('response.headers.link: ', response.headers.link)
  let lastGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"last\"'))[0];
  if(lastGroup) {
    lastUrl = lastGroup.match(/\<(.*)\>\;\s*rel=\"last\"/)[1];
    lastPg = lastUrl.match(/page=(\d*)/)[1];
    console.log('lastPg ', lastPg)
    let nextGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"next\"'))[0];
    console.log('nextGroup ', nextGroup)
    // if(nextGroup) {

      // axios({
      //   method:'get',
      //   url:`https://api.github.com/rate_limit`,
      //   headers: {Authorization: config.apiKey},
      // })
      // .then(res => {
      //   // console.log('search rate_limit: ', res.resources.search)
      //   console.log('core rate_limit: ', res.data.resources)
      // })



      nextUrl = nextGroup.match(/\<(.*)\>\;\s*rel=\"next\"/)[1]
      nextPg = nextUrl.match(/page=(\d*)/)[1]
      currentPg = nextPg - 1;
      console.log('========================= currentPg: ', currentPg)
    // }



  } else {
    console.log('inside else for more')
    more = false;
  }

  console.log('response.data.items ', response.data.items.length)

  // GRAB NEXT PAGE OF API RESULTS
  Promise.all(response.data.items.map(setObject))
  .then((info) => {
    console.log('info.length ', info.length)
    console.log('nextUrl ----------------- ', nextUrl)
    console.log('lastPg ', lastPg)
    console.log('nextPg ', nextPg)
    console.log('this is more: ', more)
    if(nextUrl) {
      callNext(nextUrl)
    }
    // else {
    //   console.log('all the debugging')
    //   return;
    // }

  })
  .catch(err => {
    console.log('not going further')
    console.error(err.message)
  })
}
