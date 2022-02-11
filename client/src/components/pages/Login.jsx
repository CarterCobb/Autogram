import React, { useState } from "react";
import "../../styles/login.css";
import { Form, Button, Input, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import AccountAPI from "../../api/account";

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    AccountAPI.login(values, (logged_in) => {
      if (logged_in) window.location.href = "/";
      else {
        setLoading(false);
        notification.error({
          message: "Failed to login",
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
        <div className="login-section">
          <h1>Login</h1>
          <Form name="normal_login" className="login-form" onFinish={onFinish}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
                loading={loading}
                disabled={loading}
              >
                Log in
              </Button>
              Or <a href="/register">register now!</a>
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

export default Login;
