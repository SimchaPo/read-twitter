require("dotenv").config();

var express = require("express");
var path = require("path");
require("twitter-url-direct");
const tinyurl = require("tinyurl-api");

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

const getTweetUrl = (username, id) => {
  return `https://twitter.com/${username}/status/${id}`;
};

async function getRequest(
  link = "https://twitter.com/DontShowYourCat/status/1564071707245264897"
) {
  console.log(link);
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

  let urlsForVideos = [];

  const mediaData = firstRes.body?.includes?.media;

  let tinyurlVideo = [];

  params = {
    query: `conversation_id:${twittId} from:${username} to:${username}`,
    expansions: "author_id,attachments.media_keys",
    "tweet.fields":
      "in_reply_to_user_id,author_id,entities,created_at,conversation_id",
    "media.fields": "preview_image_url,type,url",
  };

  let text = [];
  let mediaUrls = [];
  let res;

  do {
    res = await needle("get", endpointURLSearch, params, {
      headers: {
        "User-Agent": "v2TweetLookupJS",
        authorization: `Bearer ${token}`,
      },
    });
    if (res.body?.data)
      for (const element of res.body?.data) {
        await manageElement(
          element,
          username,
          urlsForVideos,
          text,
          res.body?.includes?.media,
          tinyurlVideo
        );
      }

    res.body?.includes?.media?.forEach((element) => {
      mediaUrls.unshift(element);
    });

    params.next_token = res.body?.meta?.next_token;
  } while (res.body?.meta?.next_token);

  if (mediaData) mediaUrls.unshift(...mediaData);
  await manageElement(
    firstRes.body?.data,
    username,
    urlsForVideos,
    text,
    firstRes.body?.includes?.media,
    tinyurlVideo
  );

  // text.unshift(firstRes.body?.data?.text);

  text = text.join("\n\n");

  if (res.body) {
    return {
      text,
      mediaData: mediaUrls.filter((media) => media.url),
      username,
      name,
      tinyurlVideo,
    };
  } else {
    throw new Error("Unsuccessful request");
  }
}

app.get("/", function (req, res) {
  res.send("Welcome Home");
});

app.get("/tcs", async function (req, res) {
  // console.log(req.query);
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
async function manageElement(
  element,
  username,
  urlsForVideos,
  text,
  media = null,
  tinyurlVideo
) {
  if (element.attachments) {
    const media_keys = element.attachments.media_keys;
    const video_media_keys = media
      .filter((med) => med.type === "video")
      .map((med) => med.media_key);
    const found = media_keys.some((r) => video_media_keys.indexOf(r) >= 0);
    if (found) {
      let tweetUrl = getTweetUrl(username, element.id);
      urlsForVideos.push({
        media_keys: element.attachments.media_keys,
        tweetUrl,
      });
      let videoUrl = await twitterGetUrl(tweetUrl);
      if (videoUrl.found && videoUrl.type.includes("video")) {
        if (videoUrl.download?.[0]?.url) {
          tinyurlVideo.push(videoUrl.download?.[0]?.url);
          // const url = await tinyurl(videoUrl.download?.[0]?.url);
          // let downloadText = `(Download attached video:\n${url} )`;
          // text.unshift(downloadText);
        }
      }
    }
  }
  // console.log(elemen\t, element.entities?.urls);
  const urls = element?.entities?.urls;
  urls?.forEach((url) => {
    element.text = element.text.replace(
      url.url,
      url.media_key ? "" : url.expanded_url
    );
  });
  text.unshift(element.text);
}
