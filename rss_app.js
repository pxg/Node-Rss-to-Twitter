var request = require('request'),
    url = require('url'),
    htmlparser = require('htmlparser'),
    fs = require('fs'),
    OAuth = require('oauth').OAuth;

// Config variables
var rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml';
var intervalLength = 2000;

// Setup vars for twitter posting
var twitterConsumerKey = 'add your key here';
var twitterConsumerSecret = 'add your secret here';
var twitterAccessToken = 'add your token here';
var twitterAccessTokenSecret = 'add your token secret here';

oAuth= new OAuth("http://twitter.com/oauth/request_token",
    "http://twitter.com/oauth/access_token", 
    twitterConsumerKey,
    twitterConsumerSecret, 
    "1.0A",
    null,
    "HMAC-SHA1"
);

// Get date of latest posted article
var lastestPostedItemDate = getLatestPostedItemDate();

// Needed for RSS parsing
var handler = new htmlparser.RssHandler();
var parser = new htmlparser.Parser(handler);

// function to sort of dates
function compareDates(a, b) {
    var aDate = new Date(a.pubDate);
    var bDate = new Date(b.pubDate);

    if (aDate < bDate)
        return -1;
    if (aDate > bDate)
        return 1;
    return 0;
}

// get the date (uses flat file to be replaced with MongoDB)
function getLatestPostedItemDate(){
    var dateString = fs.readFileSync('lastestPostedDate.txt').toString();
    return new Date(dateString);
}

// set the date (uses flat file to be replaced with MongoDB)
function setLatestPostedItemDate(date){
    lastestPostedItemDate = date;
    // write to file
    fs.writeFile('lastestPostedDate.txt', lastestPostedItemDate);
    return true;
}

// post item to twitter
function publishToTwitter(item){
    var tweet = item.title + ' ' + item.link;
    console.log('publishing to twitter');
    oAuth.post('https://api.twitter.com/1.1/statuses/update.json',
    twitterAccessToken,
    twitterAccessTokenSecret,
    {'status': tweet},
    function(error, data) {
         if(error) console.log(require('util').inspect(error))
         //else console.log('succcess!' + data)
    });
    //
}

// looping on the server (every second)
setInterval(function(){
    request({uri: rssUrl}, function(err, response, body){

        // Basic error check
        if(err && response.statusCode !== 200){
            console.log('Request error.');
        }
        
        parser.parseComplete(body);
        var items = handler.dom.items;
        var itemsToPublish = []; // Array

        for(key in items){
            //console.log(prop + ': ' + items[prop].title + ' ' + items[prop].link + '\n');
            var itemDate = new Date(items[key].pubDate);
            if(itemDate > lastestPostedItemDate){
                // add to a publish array here
                itemsToPublish.push(items[key]);
            };
        }
        // sort items to publish on pubDate
        itemsToPublish.sort(compareDates);

        for(var i in itemsToPublish){
            console.log(itemsToPublish[i].pubDate + ' ' + itemsToPublish[i].title);
            publishToTwitter(itemsToPublish[i]);
            setLatestPostedItemDate(itemsToPublish[i].pubDate);
        }
    });
    console.log('\n');
}, intervalLength);
