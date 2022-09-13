require("dotenv").config();

var express = require("express");
var path = require("path");

var app = express();
var cors = require("cors");

app.use(cors());

app.use(express.static("public"));

const needle = require("needle");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const token = process.env.BEARER_TOKEN;

const endpointURLTweets = "https://api.twitter.com/2/tweets";

const endpointURLSearch = `https://api.twitter.com/2/tweets/search/recent`;

async function getRequest(
  link = "https://twitter.com/DontShowYourCat/status/1564071707245264897"
) {
  const startSlice = link.lastIndexOf("/") + 1;
  const endSlice = link.lastIndexOf("?");

  const twittId = link.slice(startSlice, endSlice > 0 ? endSlice : link.length);

  let params = {
    expansions: "author_id,attachments.media_keys",
    "tweet.fields":
      "in_reply_to_user_id,author_id,entities,created_at,conversation_id",
    "user.fields": "username,name",
    "media.fields": "preview_image_url,type,url",
  };

  let firstRes = await needle(
    "get",
    `${endpointURLTweets}/${twittId}`,
    params,
    {
      headers: {
        "User-Agent": "v2TweetLookupJS",
        authorization: `Bearer ${token}`,
      },
    }
  );

  let { name, username } = firstRes.body.includes?.users?.[0];

  const mediaData = firstRes.body?.includes?.media;

  params = {
    query: `conversation_id:${twittId} from:${username} to:${username}`,
    expansions: "author_id,attachments.media_keys",
    "tweet.fields": "in_reply_to_user_id,author_id,created_at,conversation_id",
    "media.fields": "preview_image_url,type,url",
  };

  let res = await needle("get", endpointURLSearch, params, {
    headers: {
      "User-Agent": "v2TweetLookupJS",
      authorization: `Bearer ${token}`,
    },
  });

  let text = [];
  let mediaUrls = [];

  res.body?.data?.forEach((element) => {
    text.unshift(element.text);
  });

  res.body?.includes?.media?.forEach((element) => {
    mediaUrls.unshift(element);
  });

  console.log(res.body); //.includes?.media);

  // console.log(res.body);

  while (res.body?.meta?.next_token) {
    // console.log(res.body?.meta);
    // params.since_id = res.body.meta.newest_id;
    params.next_token = res.body.meta.next_token;
    // console.log(params);
    res = await needle("get", endpointURLSearch, params, {
      headers: {
        "User-Agent": "v2TweetLookupJS",
        authorization: `Bearer ${token}`,
      },
    });

    res.body?.data?.forEach((element) => {
      text.unshift(element.text);
    });

    if (res.body?.includes?.media)
      mediaUrls.unshift(...res.body?.includes?.media);

    // res.body?.includes?.media?.forEach((element) => {
    //   console.log(element);
    //   mediaUrls.unshift(element);
    // });
  }

  text.unshift(firstRes.body?.data?.text);
  if (mediaData) mediaUrls.unshift(...mediaData);

  text = text.join("\n\n");
  console.log(mediaUrls);

  if (res.body) {
    return {
      text,
      mediaData: mediaUrls.filter((media) => media.url),
      username,
      name,
    };
  } else {
    throw new Error("Unsuccessful request");
  }
}

app.get("/", function (req, res) {
  res.send("Welcome Home");
});

app.get("/tcs", async function (req, res) {
  console.log(req.query);
  let response = await getRequest(req.query.link);
  res.send(response);
});

// Handle 404 - Keep this as a last route
app.use(function (req, res, next) {
  res.status(404);
  res.send("404: File Not Found");
});

app.use(express.static(path.join(__dirname, "../build")));
app.use(express.static("dist"));

app.listen(8080, function () {
  console.log("Example app listening on port 8080!");
});
