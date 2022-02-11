import React, { useRef, useState, useEffect, Fragment } from "react";
import AccountAPI from "../../api/account";
import "../../styles/home.css";
import Template from "./Template";
import { useDraggableScroll } from "../hooks/useDraggableScroll";
import {
  HeartOutlined,
  MessageOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { MdVerified } from "react-icons/md";
import { Button, Form, Input, Spin, Result, notification } from "antd";
import Stories from "./Stories";
import { prettyDate } from "../../helpers/functions";

const Home = ({ user: _user }) => {
  const [user, setUser] = useState(_user);
  const [suggestions, setSuggestions] = useState(null);
  const [posts, setPosts] = useState(null);
  const [stories, setStories] = useState(null);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingUnfollow, setLoadingUnfollow] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    setUser(_user);
    AccountAPI.getSuggestions(setSuggestions);
    AccountAPI.getPostsfromFollows(_user, setPosts);
    AccountAPI.getStoriesFromFollows(_user, setStories);
  }, [_user]);

  const storyContainer = useRef(null);
  const { onMouseDown } = useDraggableScroll(storyContainer, {
    direction: "horizontal",
  });

  const top = () =>
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

  const followUser = (account) => {
    setLoadingFollow(true);
    AccountAPI.followAccount(account.id, (success) => {
      setLoadingFollow(false);
      setUser({ ...user, following: [...user.following, account.id] });
      if (!success)
        notification.error({
          message: `Failed to follow ${account.username}`,
          placement: "bottomRight",
        });
      else
        notification.success({
          message: `Followed ${account.username}`,
          placement: "bottomRight",
        });
    });
  };

  const unfollowUser = (account) => {
    setLoadingUnfollow(true);
    AccountAPI.unfollowAccount(account.id, (success) => {
      setLoadingUnfollow(false);
      setUser({
        ...user,
        following: [...user.following.filter((x) => x !== account.id)],
      });
      if (!success)
        notification.error({
          message: `Failed to unfollow ${account.username}`,
          placement: "bottomRight",
        });
      else
        notification.success({
          message: `Unfollowed ${account.username}`,
          placement: "bottomRight",
        });
    });
  };

  return (
    <Fragment>
      {showStories ? (
        <Stories
          stories={stories}
          close={() => setShowStories(false)}
          index={storyIndex}
        />
      ) : (
        <Template user={user}>
          <div id="home-main-container">
            <div id="posts-section">
              <div
                ref={storyContainer}
                onMouseDown={onMouseDown}
                id="story-container"
              >
                <div style={{ whiteSpace: "nowrap" }}>
                  <img
                    src={user.image}
                    className={
                      user.stories.length > 0
                        ? "story-profile-img active-story"
                        : "story-profile-img"
                    }
                    draggable={false}
                    onClick={() => {
                      setStoryIndex(0);
                      setShowStories(true);
                    }}
                    alt="profile"
                  />
                  {stories === null ? (
                    <div className="loading-container">
                      <Spin size="default" tip="Loading..." />
                    </div>
                  ) : (
                    stories.map(
                      (account, i) =>
                        account[0].account.id !== user.id && (
                          <img
                            alt="story"
                            key={i}
                            src={account[0].account.image}
                            className="story-profile-img active-story"
                            draggable={false}
                            onClick={() => {
                              setStoryIndex(i);
                              setShowStories(true);
                            }}
                          />
                        )
                    )
                  )}
                </div>
              </div>
              <div id="posts-container">
                {posts === null ? (
                  <div className="loading-container">
                    <Spin size="default" tip="Loading..." />
                  </div>
                ) : (
                  posts.map((post, i) => (
                    <div className="autogram-post" key={i}>
                      <div className="post-header">
                        <a href={`/profile/${post.account.username}`}>
                          <img
                            alt="story"
                            src={post.account.image}
                            className={
                              post.account.stories.length > 0
                                ? "post-profile-img active-story"
                                : "post-profile-img"
                            }
                          />
                        </a>
                        <div className="post-header-info">
                          <p>
                            <b>
                              {post.account.username}&nbsp;
                              {post.account.permissions.is_verified && (
                                <MdVerified color="#3897f0" />
                              )}
                            </b>
                          </p>
                          <p>{prettyDate(post.posted_at)}</p>
                        </div>
                      </div>
                      <img
                        className="post-main-img"
                        src={post.image}
                        alt="post"
                      />
                      <div className="post-details-container">
                        <div className="post-icon-bar">
                          <HeartOutlined className="post-icon heart-icon" />
                          <MessageOutlined className="post-icon" />
                        </div>
                        <p className="post-like-count">
                          Liked by {post.likes} people
                        </p>
                        <p className="post-bio">
                          <b>{post.account.username}</b> {post.description}
                        </p>
                        <Form
                          className="post-comment-bar"
                          onFinish={() => console.log("finised")}
                        >
                          <Form.Item
                            name="comment"
                            className="post-comment-input"
                          >
                            <Input
                              prefix={<MessageOutlined />}
                              placeholder="type a comment..."
                            />
                          </Form.Item>
                        </Form>
                      </div>
                    </div>
                  ))
                )}
                <div className="autogram-post">
                  <Result
                    icon={<CheckOutlined style={{ color: "#da2e78" }} />}
                    title="All caught up!"
                    subTitle="Youve seen all the posts from people you follow."
                    extra={[
                      <Button key="top" onClick={top}>
                        Go to top
                      </Button>,
                    ]}
                  />
                </div>
              </div>
            </div>
            <div id="sugested-section">
              <div id="home-sticky-section-account">
                <div>
                  <a href={`/profile/${user.username}`}>
                    <img src={user.image} alt="profile" />
                  </a>
                  <p>
                    <b>{user.username}</b>
                  </p>
                </div>
                <div className="spacer" />
                <Button onClick={AccountAPI.logout}>Logout</Button>
              </div>
              <p id="suggestions-text">Suggestions for you:</p>
              <div id="suggestions-container">
                {suggestions === null ? (
                  <div className="loading-container">
                    <Spin size="default" tip="Loading..." />
                  </div>
                ) : (
                  suggestions.map((account) => (
                    <div className="suggestion" key={account.id}>
                      <a href={`/profile/${account.username}`}>
                        <img src={account.image} alt="profile" />
                      </a>
                      <p>
                        {account.username}&nbsp;
                        {account.permissions.is_verified && (
                          <MdVerified color="#3897f0" />
                        )}
                      </p>
                      <div className="spacer" />
                      {user.following.includes(account.id) ? (
                        <Button
                          className="suggestion-follow"
                          type="link"
                          onClick={() => unfollowUser(account)}
                          loading={loadingUnfollow}
                          disabled={loadingUnfollow}
                        >
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          className="suggestion-follow"
                          type="link"
                          onClick={() => followUser(account)}
                          loading={loadingFollow}
                          disabled={loadingFollow}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Template>
      )}
    </Fragment>
  );
};

export default Home;
