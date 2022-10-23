import "./App.css";
import "antd/dist/antd.min.css";
import { useState } from "react";
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
  const [data, setData] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const [userName, setUserName] = useState();
  const [name, setName] = useState();
  const serverUrl = config.url.SERVER_URL;

  const handleSubmit = async (url) => {
    setLoading(true);
    axios
      .get(`${serverUrl}/tcs`, {
        params: { link: url },
      })
      .then((res) => {
        // console.log(JSON.stringify(res.data));
        setData(he.decode(res.data.text));
        setMediaData(res.data.mediaData);
        setUserName(res.data.username);
        setName(res.data.name);
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

  const onFill = () => {
    form.setFieldsValue({
      "Tweet Url":
        "https://twitter.com/grabbou/status/1567486204349644801?s=20&t=k6hTGIaC4Qrt_yaT2cN7UQ",
    });
  };

  const blobUrlToFile = (blobUrl, index) =>
    new Promise((resolve) => {
      console.log(blobUrl);
      fetch(blobUrl.url).then((res) => {
        res.blob().then((blob) => {
          // please change the file.extension with something more meaningful
          // or create a utility function to parse from URL
          const file = new File([blob], `${index}.jpg`, { type: blob.type });
          resolve(file);
        });
      });
    });

  async function onShare(type) {
    const title = document.title;
    const url = document.querySelector("link[rel=canonical]")
      ? document.querySelector("link[rel=canonical]").href
      : document.location.href;
    let text;
    let files = [];
    if (type === "text") {
      text = getTextForShare;

      files.push(
        mediaData?.length === 1
          ? await Promise.all(
              mediaData.map((obj, index) => blobUrlToFile(obj, index))
            )
          : await blobUrlToFile(
              {
                url: "https://pbs.twimg.com/profile_images/1525820610860941313/SrnHe2N1_400x400.jpg",
              },
              "general"
            )
      );
    }
    if (type === "files") {
      files = await Promise.all(
        mediaData.map((obj, index) => blobUrlToFile(obj, index))
      );
    }
    // console.log(files);
    try {
      let shareObj = {
        title,
        // url,
        text,
        files,
      };
      await navigator.share(shareObj);
    } catch (err) {
      // alert(`Couldn't share ${err}`);
    }
  }

  const getTextForShare = `Extract By Simcha's Bot\nhttps://read-twitter-project.uc.r.appspot.com/\n\n${name} (@${userName})\n\n${data}\n\n${
    form.getFieldValue("Tweet Url")?.split("?")[0]
  }`;
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
                {/* <Button htmlType="button" onClick={onFill}>
                  Test Me
                </Button> */}
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
                        >
                          {`Share ${mediaData?.length >= 2 ? "Text" : ""}`}
                        </Button>
                        {mediaData?.length >= 2 && (
                          <Button
                            icon={<ShareAltOutlined />}
                            type="link"
                            htmlType="button"
                            onClick={() => onShare("files")}
                          >
                            Share Images
                          </Button>
                        )}
                      </Row>
                      <Row>
                        <Paragraph
                          copyable={{
                            format: "text/plain",
                            text: getTextForShare,
                          }}
                          style={{ whiteSpace: "pre-wrap" }}
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
