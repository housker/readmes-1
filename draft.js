const axios = require('axios');
const marked = require('marked');
const config = require('./config.js');
const db = require('./dbhelpers.js');

// FETCH GITHUB READMES
let ranges = [ '>5000', '5000..3001', '3000..1001', '1000..501', '500..300' ]
// for(let i = 0; i < ranges.length; i++) {


function callRange(i = 0) {
    console.log('================ index being called: ')
  console.log(i)
  axios({
    method:'get',
    url:`https://api.github.com/search/repositories?q=stars:${ranges[i]}`,
    headers: {Authorization: config.apiKey}
  })
  .then(function(response) {
    console.log('response ', response)
    const totalPages = parseInt(response.headers.link.split(',')[1].match(/page=(\d*)/)[1])
    grabEntries(response);

// GRAB NEXT RANGE
  Promise.all(response.map(grabEntries))
  .then((info) => {
    while(i < ranges.length - 1) {
      console.log('++++++++++++++++++++++++ range is being called: ')
      console.log(i)
      callRange(++i)
    }
  })
  .catch(err => console.error(err.message))

  });
}


// }


function callNext(next) {
  axios(next)
  .then((response) => {
    grabEntries(response)
  })
  .catch(err => err)
}

// function callNextRange(next) {
//   axios(next)
//   .then((response) => {
//     callRange(response)
//   })
//   .catch(err => err)
// }

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
      db.addArticle(entry, (success) => console.log(success))
      resolve(entry.title)
    })
    .catch(err => {
      resolve('')
    })
  });
}


async function grabEntries(response) {
  return new Promise((resolve, reject) => {

  let allEntries = [];
  let nextUrl, nextPg, currentPg, lastUrl, lastPg;
  console.log('response.headers.link _______________')
  console.log(response.headers.link)
  let lastGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"last\"'))[0]
  let nextGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"next\"'))[0]
  console.log('nextGroup: ', nextGroup)
  if(nextGroup) {
    nextUrl = nextGroup.match(/\<(.*)\>\;\s*rel=\"next\"/)[1]
    nextPg = nextUrl.match(/page=(\d*)/)[1]
    currentPg = nextPg - 1;
    lastUrl = lastGroup.match(/\<(.*)\>\;\s*rel=\"last\"/)[1]
    lastPg = lastUrl.match(/page=(\d*)/)[1]
    console.log('currentPg: ', currentPg)
    console.log('lastPg: ', lastPg)
  }

  // GRAB NEXT PAGE OF API RESULTS
  Promise.all(response.data.items.map(setObject))
  .then((info) => {
    callNext(nextUrl);
  })
  .then(() => {
    console.log('=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=')
    if(currentPg === lastPg) {
      console.log('currentPg matches lastPg')
    }
  })
  .catch(err => console.error(err.message))


  })

}




callRange(0);
