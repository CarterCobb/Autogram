import React, { useState } from "react";
import "../../styles/login.css";
import { Form, Button, Input, Upload, notification } from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoadingOutlined,
  PlusOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  beforeUpload,
  getBase64,
  imageRequest,
} from "../../helpers/image-actions";
import AccountAPI from "../../api/account";
import ImgCrop from "antd-img-crop";

const Register = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Profile Image</div>
    </div>
  );

  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (imageUrl) => {
        setImageUrl(imageUrl);
        setLoading(false);
      });
    }
  };

  const onFinish = (values) => {
    setRegistering(true);
    values.encoded_img = imageUrl;
    AccountAPI.register(values, (succeeded) => {
      if (!succeeded.error) window.location.href = "/";
      else {
        setRegistering(false);
        notification.error({
          message: succeeded.error,
          placement: "bottomRight",
        });
      }
    });
  };

  return (
    <div id="login-container">
      <div id="login-logo">
        <h1>
          <i>Autogram</i>
        </h1>
      </div>
      <div id="login-center-container">
        <div className="login-section login-img-container">
          <h1>Autogram</h1>
          <p>An automotive platform</p>
        </div>
        <div className="login-section login-form-container">
          <h1>Register</h1>
          <Form name="normal_login" className="login-form" onFinish={onFinish}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                autoComplete="email"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="bio"
              rules={[{ required: true, message: "Please input bio" }]}
            >
              <Input.TextArea
                showCount
                maxLength={100}
                placeholder="Enter your bio"
                className="register-textarea"
              />
            </Form.Item>
            <Form.Item
              rules={[
                { required: true, message: "Please addd a profile image" },
              ]}
            >
              <ImgCrop rotate grid aspect={1 / 1}>
                <Upload
                  customRequest={imageRequest}
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleChange}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="avatar"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </ImgCrop>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
                loading={registering}
                disabled={registering}
              >
                Register
              </Button>
              Have an account? <a href="/login">login</a>
            </Form.Item>
          </Form>
        </div>
      </div>
      <span id="login-legal">
        &copy; Autogram 2022&nbsp;&nbsp;<a>Privacy Policy</a>&nbsp;&nbsp;
        <a>Terms of Use</a>
      </span>
    </div>
  );
};

export default Register;
