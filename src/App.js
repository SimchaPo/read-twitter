import "./App.css";
import "antd/dist/antd.min.css";
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { message, Typography, Row, Col, Spin } from "antd";
import Grid from "antd/lib/card/Grid";
import he from "he";
import { config } from "./Constants";
import { Birds } from "./Birds";
import { UrlForm } from "./UrlForm";
import LinkedInProfile from "./LinkedInProfile";
const TweetThread = lazy(() => import("./TweetThread"));

const { Title } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const [tinyurlVideo, settinyurlVideo] = useState([]);
  const [userName, setUserName] = useState();
  const [name, setName] = useState();
  const [tweetUrl, setTweetUrl] = useState();
  const serverUrl = config.url.SERVER_URL;

  const handleSubmit = useCallback(
    async (url) => {
      setLoading(true);
      setTweetUrl(url);
      axios
        .get(`${serverUrl}/tcs`, {
          params: { link: url },
        })
        .then((res) => {
          setData(he.decode(res.data.text));
          setMediaData(res.data.mediaData);
          settinyurlVideo(res.data.tinyurlVideo);
          setUserName(res.data.username);
          setName(res.data.name);
          if (res.data.errorMessage?.length > 0)
            message.error(res.data.errorMessage);
        })
        .catch(() => {
          setData("");
          setMediaData([]);
          settinyurlVideo([]);
          setUserName();
          setName();
          message.error("Problem with URL");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [serverUrl]
  );

  const getTextForShare = useMemo(
    () =>
      `Extracted By Simcha's Bot\nhttps://read-twitter-project.uc.r.appspot.com/\n\n${name} (@${userName})\n\n${data}\n\n${
        tweetUrl?.split("?")[0]
      }`,
    [name, data, userName, tweetUrl]
  );

  useEffect(() => {
    message.warning(
      "Due to Twitter's increased API costs, this application may cease functioning once my access is blocked. I apologize for any inconvenience and appreciate your support thus far. You can follow me on LinkedIn for future project updates. Thank you for your understanding."
    );
  }, []);

  return (
    <Grid
      style={{
        width: "100%",
        backgroundColor: "#f0fff0",
      }}
    >
      <Birds />
      <Row>
        <Col span={24}>
          <Title mark level={1} style={{ textAlign: "center" }}>
            Simcha's Bot
          </Title>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <UrlForm handleSubmit={handleSubmit} />
        </Col>
      </Row>

      {(loading || data) && (
        <Row>
          <Col span={24}>
            {loading ? (
              <Spin />
            ) : (
              <TweetThread
                data={data}
                mediaData={mediaData}
                tinyurlVideo={tinyurlVideo}
                getTextForShare={getTextForShare}
              />
            )}
          </Col>
        </Row>
      )}
      <LinkedInProfile />
    </Grid>
  );
}

export default App;
