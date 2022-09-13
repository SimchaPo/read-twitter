import "./App.css";
import "antd/dist/antd.css";
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
              <Input placeholder="insert tweet url" allowClear />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Get Tweet
                </Button>
                <Button htmlType="button" onClick={onFill}>
                  Test Me
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
                    <Paragraph
                      copyable={{
                        format: "text/plain",
                        text: `Extract By Simcha's Bot\nhttps://read-twitter-project.uc.r.appspot.com/\n\n${name} (@${userName})\n\n${data}\n\n${form.getFieldValue(
                          "Tweet Url"
                        )}`,
                      }}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {data}
                    </Paragraph>
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