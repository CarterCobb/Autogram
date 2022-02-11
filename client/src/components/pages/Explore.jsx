import React, { useState, useEffect, Fragment } from "react";
import Template from "./Template";
import { Spin, Input, Form, Modal } from "antd";
import AccountAPI from "../../api/account";
import { MdVerified } from "react-icons/md";
import { prettyDate } from "../../helpers/functions";
import {
  SearchOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import "../../styles/explore.css";

const Explore = () => {
  const [accounts, setAccounts] = useState(null);
  const [searching, setSearching] = useState(false);
  const [openPost, setOpenPost] = useState({ state: false, post: {} });

  useEffect(() => {
    AccountAPI.getAllAccounts(setAccounts);
  }, []);

  if (accounts === null)
    return (
      <div className="center-403">
        <Spin size="large" tip="Loading..." />
      </div>
    );

  const onFinish = (values) => {
    setSearching(true);
    if (!values.search) {
      AccountAPI.getAllAccounts((a) => {
        setAccounts(a);
        setSearching(false);
      });
    }
    AccountAPI.getUserByUsername(values.search, (profile) => {
      if (profile) {
        setAccounts([profile]);
        setSearching(false);
      } else {
        setSearching(false);
      }
    });
  };

  const posts = [].concat(
    ...accounts.map((x, i) =>
      x.posts.map((y) => ({ ...JSON.parse(y), account: accounts[i] }))
    )
  );

  const rows = [];
  for (var set = 0; set < posts.length / 3; set++) {
    const children = [];
    for (var i = 0; i < set + 3; i++) {
      try {
        const post = posts[i + set * 3];
        children.push(
          <div
            key={post.id}
            className="post-grid-row-img"
            onClick={({ target: { name } }) =>
              setOpenPost({
                state: true,
                post: posts[name],
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

  return (
    <Template>
      {searching ? (
        <div className="center-403">
          <Spin size="large" tip="Searching..." />
        </div>
      ) : (
        <div id="explore-main-container">
          <Form id="search-form" onFinish={onFinish}>
            <Form.Item id="search-form" name="search">
              <Input
                className="search-bar"
                prefix={<SearchOutlined />}
                placeholder="Search for account..."
              />
            </Form.Item>
          </Form>

          <div id="post-grid-container">{rows}</div>
        </div>
      )}
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
    </Template>
  );
};

export default Explore;
