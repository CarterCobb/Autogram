import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AccountAPI from "../../api/account";
import Template from "./Template";
import { Button, Spin, Modal, Form, Input, Upload, notification } from "antd";
import Stories from "./Stories";
import { MdGridOn, MdVerified } from "react-icons/md";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  LoadingOutlined,
  PlusOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import {
  beforeUpload,
  imageRequest,
  getBase64,
} from "../../helpers/image-actions";
import { prettyDate } from "../../helpers/functions";
import "../../styles/profile.css";

// 'open' means the page was accessed without the user being logged in. some changes may need to be made to display properly
const Profile = ({ user, open }) => {
  const [account, setAccount] = useState(user);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [showStories, setShowStories] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingUnfollow, setLoadingUnfollow] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState({ changed: false, src: user.image });
  const [updating, setUpdating] = useState(false);
  const [openPost, setOpenPost] = useState({ state: false, post: {} });
  const params = useParams();

  useEffect(() => {
    if (open || params.username !== user.username) {
      AccountAPI.getUserByUsername(params.username, (a) => {
        setAccount(a);
        setLoadingAccount(false);
      });
    } else {
      setLoadingAccount(false);
    }
  }, [params, open, user.username]);

  const followUser = (account) => {
    setLoadingFollow(true);
    AccountAPI.followAccount(account.id, (success) => {
      setLoadingFollow(false);
      window.location.reload();
    });
  };

  const unfollowUser = (account) => {
    setLoadingUnfollow(true);
    AccountAPI.unfollowAccount(account.id, (success) => {
      setLoadingUnfollow(false);
      window.location.reload();
    });
  };

  const updateProfile = (values) => {
    setUpdating(true);
    const payload = {};
    for (var key of Object.keys(values))
      if (values[key] !== user[key] && key !== "password")
        payload[key] = values[key];
    if (values.password) payload.password = values.password;
    if (imageUrl.changed) payload.image = imageUrl.src;
    AccountAPI.updateUser(payload, (success) => {
      if (success) window.location.reload();
      else {
        setUpdating(false);
        notification.error({
          message: "Failed to update profile",
          placement: "bottomRight",
        });
      }
    });
  };

  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (imageUrl) => {
        setImageUrl({ changed: true, src: imageUrl });
        setLoading(false);
      });
    }
  };

  if (loadingAccount)
    return (
      <div className="center-403">
        <Spin size="large" tip="Loading..." />
      </div>
    );

  const rows = [];
  for (var set = 0; set < account.posts.length / 3; set++) {
    const children = [];
    for (var i = 0; i < set + 3; i++) {
      var post = {};
      try {
        post = JSON.parse(account.posts[i + set * 3]);
        post.account = account;
        children.push(
          <div
            key={post.id}
            className="post-grid-row-img"
            onClick={({ target: { name } }) =>
              setOpenPost({
                state: true,
                post: { ...JSON.parse(account.posts[name]), account },
              })
            }
          >
            <img src={post.image} alt="post" name={i + set * 3} />
          </div>
        );
      } catch {
        children.push(<div key={i + set * 3} className="spacer" />);
      }
    }
    var row = (
      <div
        className="post-grid-row"
        children={<Fragment>{children}</Fragment>}
        key={set}
      />
    );
    rows.push(row);
  }

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Media Image</div>
    </div>
  );

  return (
    <Fragment>
      {showStories ? (
        <Stories
          stories={[
            account.stories.map((s) => ({ ...JSON.parse(s), account })),
          ]}
          close={() => setShowStories(false)}
          index={0}
        />
      ) : (
        <Template user={user}>
          <div id="profile-main-container">
            <div id="profile-header">
              <img
                src={account.image}
                className={
                  account.stories.length > 0
                    ? "profile-img active-story"
                    : "profile-img"
                }
                onClick={() => {
                  if (account.stories.length > 0) setShowStories(true);
                }}
                alt="profile"
              />
              <div id="profile-details-container">
                <h1>
                  {account.username}&nbsp;
                  {account.permissions.is_verified && (
                    <MdVerified color="#3897f0" />
                  )}
                </h1>
                <div id="count-bar">
                  <span>
                    <b>{account.posts.length}</b> post
                    {account.posts.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    <b>{account.followers.length}</b> follower
                    {account.followers.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    <b>{account.following.length}</b> following
                  </span>
                  <div className="spacer" />
                </div>
                <p id="profile-bio">{account.bio}</p>
                {!open && account.id === user.id && (
                  <Button onClick={() => setOpenEdit(true)}>
                    Edit profile
                  </Button>
                )}
                {!open && account.id !== user.id ? (
                  <div id="action-bar">
                    {user.following.includes(account.id) ? (
                      <Button
                        onClick={() => unfollowUser(account)}
                        loading={loadingUnfollow}
                        disabled={loadingUnfollow}
                      >
                        Unfollow
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => followUser(account)}
                        loading={loadingFollow}
                        disabled={loadingFollow}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                ) : null}
                {open && (
                  <Button
                    type="primary"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Login to interact
                  </Button>
                )}
              </div>
            </div>
            <div id="profile-posts-container">
              <div id="profile-posts-bar">
                <MdGridOn />
                &nbsp; POSTS
              </div>
            </div>
            <div id="post-grid-container">{rows}</div>
          </div>
        </Template>
      )}
      <Modal
        title="Edit Profile"
        visible={openEdit}
        onCancel={() => setOpenEdit(false)}
        centered
        footer={null}
      >
        <Form
          name="normal_login"
          className="login-form"
          onFinish={updateProfile}
        >
          <Form.Item>
            <ImgCrop rotate grid aspect={1 / 1}>
              <Upload
                customRequest={imageRequest}
                listType="picture-card"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                className="profile-update-modal"
              >
                {imageUrl.src ? (
                  <img
                    src={imageUrl.src}
                    alt="avatar"
                    style={{ width: "100%" }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
          <Form.Item name="email" initialValue={user.email}>
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item name="password">
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>
          <Form.Item name="username" initialValue={user.username}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item name="bio" initialValue={user.bio}>
            <Input.TextArea
              showCount
              maxLength={100}
              placeholder="Enter your bio"
              className="profile-update-modal"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={updating}
              disabled={updating}
            >
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={null}
        visible={openPost.state}
        onCancel={() => setOpenPost({ state: false, post: {} })}
        centered
        bodyStyle={{ padding: 0 }}
        footer={null}
      >
        {openPost.state && (
          <div className="autogram-post-profile">
            <div className="post-header">
              <a href={`/profile/${openPost.post.account.username}`}>
                <img
                  alt="story"
                  src={openPost.post.account.image}
                  className={
                    openPost.post.account.stories.length > 0
                      ? "post-profile-img active-story"
                      : "post-profile-img"
                  }
                />
              </a>
              <div className="post-header-info">
                <p>
                  <b>
                    {openPost.post.account.username}&nbsp;
                    {openPost.post.account.permissions.is_verified && (
                      <MdVerified color="#3897f0" />
                    )}
                  </b>
                </p>
                <p>{prettyDate(openPost.post.posted_at)}</p>
              </div>
            </div>
            <img
              className="post-main-img"
              src={openPost.post.image}
              alt="post"
            />
            <div className="post-details-container">
              <div className="post-icon-bar">
                <HeartOutlined className="post-icon heart-icon" />
                <MessageOutlined className="post-icon" />
              </div>
              <p className="post-like-count">
                Liked by {openPost.post.likes} people
              </p>
              <p className="post-bio">
                <b>{openPost.post.account.username}</b>{" "}
                {openPost.post.description}
              </p>
              <Form
                className="post-comment-bar"
                onFinish={() => console.log("finised")}
              >
                <Form.Item name="comment" className="post-comment-input">
                  <Input
                    prefix={<MessageOutlined />}
                    placeholder="type a comment..."
                  />
                </Form.Item>
              </Form>
            </div>
          </div>
        )}
      </Modal>
    </Fragment>
  );
};

export default Profile;
