import React from "react";
import "./App.css";
import "antd/dist/antd.min.css";

import { Button, Form, Input, message, Space } from "antd";

export const UrlForm = ({ handleSubmit }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    handleSubmit(values["Tweet Url"]);
    message.success("Submit success!");
  };

  const onFinishFailed = () => {
    message.error("Submit failed!");
  };
  return (
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
  );
};
