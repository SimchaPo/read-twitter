import "./App.css";
import "antd/dist/antd.min.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Form,
  Input,
  message,
  Space,
  Typography,
  Row,
  Col,
  Spin,
  Image,
} from "antd";
import Grid from "antd/lib/card/Grid";
import he from "he";
import { config } from "./Constants";
import { Birds } from "./Birds";
import { ShareAltOutlined } from "@ant-design/icons";

const { Paragraph, Title } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [data, setData] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const [tinyurlVideo, settinyurlVideo] = useState([]);
  const [userName, setUserName] = useState();
  const [name, setName] = useState();
  const [singleFile, setSingleFile] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const serverUrl = config.url.SERVER_URL;

  const handleSubmit = async (url) => {
    setLoading(true);
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
  };

  const [form] = Form.useForm();

  const onFinish = (values) => {
    handleSubmit(values["Tweet Url"]);
    message.success("Submit success!");
  };

  const onFinishFailed = () => {
    message.error("Submit failed!");
  };

  const blobUrlToFile = (blobUrl, index, ext = "jpg") =>
    new Promise((resolve) => {
      fetch(blobUrl.url).then((res) => {
        res.blob().then((blob) => {
          const file = new File([blob], `${index}.${ext}`, { type: blob.type });
          resolve(file);
        });
      });
    });

  async function onShare(type) {
    const title = document.title;
    let text;
    let files = [];
    if (type === "text") {
      text = getTextForShare;

      files = singleFile;
    }
    if (type === "files") {
      files = allFiles;
    }
    try {
      let shareObj = {
        // title,
        text,
        files,
      };
      await navigator.share(shareObj);
    } catch (err) {}
  }

  const getTextForShare = `Extracted By Simcha's Bot\nhttps://read-twitter-project.uc.r.appspot.com/\n\n${name} (@${userName})\n\n${data}\n\n${
    form.getFieldValue("Tweet Url")?.split("?")[0]
  }`;

  useEffect(() => {
    setLoadingFiles(true);

    if (mediaData?.length >= 1) {
      blobUrlToFile(mediaData[0], "single").then((files) => {
        setSingleFile([files]);
      });
    } else if (tinyurlVideo?.length >= 1) {
      blobUrlToFile({ url: tinyurlVideo[0] }, "single", "mp4").then((files) =>
        setSingleFile([files])
      );
    } else if (getTextForShare.length > 2300) {
      blobUrlToFile(
        {
          url: "https://pbs.twimg.com/profile_images/1525820610860941313/SrnHe2N1_400x400.jpg",
        },
        "general"
      ).then((files) => setSingleFile([files]));
    }

    Promise.all([
      ...tinyurlVideo.map((obj, index) =>
        blobUrlToFile({ url: obj }, index, "mp4")
      ),
      ...mediaData.map((obj, index) => blobUrlToFile(obj, index)),
    ])
      .then((files) => setAllFiles(files))
      .finally(() => setLoadingFiles(false));
  }, [mediaData, tinyurlVideo]);

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
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              name="Tweet Url"
              label="Main Tweet URL"
              rules={[
                {
                  required: true,
                },
                {
                  type: "url",
                  warningOnly: true,
                },
                {
                  type: "string",
                  min: 6,
                },
              ]}
            >
              <Input placeholder="insert main tweet url" allowClear />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Get Thread
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          {loading ? (
            <Spin />
          ) : (
            <Row>
              <Row>
                <Col span={24}>
                  {data.length > 0 && (
                    <>
                      <Row>
                        <Button
                          icon={<ShareAltOutlined />}
                          type="link"
                          htmlType="button"
                          onClick={() => onShare("text")}
                          loading={loadingFiles}
                        >
                          {`Share Text${
                            mediaData?.length > 0
                              ? ` With ${
                                  mediaData?.length > 1 ? "First " : ""
                                }Image`
                              : tinyurlVideo?.length > 0
                              ? ` With ${
                                  tinyurlVideo?.length > 1 ? "First " : ""
                                }Video`
                              : ""
                          }`}
                        </Button>
                        {(mediaData?.length > 0 ||
                          tinyurlVideo?.length > 0) && (
                          <Button
                            icon={<ShareAltOutlined />}
                            type="link"
                            htmlType="button"
                            onClick={() => onShare("files")}
                            loading={loadingFiles}
                          >
                            {`Share/Download ${
                              mediaData?.length > 0
                                ? `${mediaData?.length} Images`
                                : ""
                            } ${
                              tinyurlVideo?.length > 0
                                ? `${tinyurlVideo?.length} Videos`
                                : ""
                            }`}
                          </Button>
                        )}
                      </Row>
                      <Row>
                        <Paragraph
                          copyable={{
                            format: "text/plain",
                            text: getTextForShare,
                          }}
                          style={{ whiteSpace: "pre-wrap", direction: "rtl" }}
                        >
                          {data}
                        </Paragraph>
                      </Row>
                    </>
                  )}
                </Col>
              </Row>
              <Row justify="center" gutter={[24, 24]}>
                {mediaData.map((obj, index) => (
                  <Col key={index} span={11}>
                    <Image src={obj.url} />
                  </Col>
                ))}
              </Row>
            </Row>
          )}
        </Col>
      </Row>
    </Grid>
  );
}

export default App;
