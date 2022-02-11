import React, { useState, Fragment } from "react";
import "../../styles/template.css";
import { Button, Modal, Upload, Input, notification } from "antd";
import {
  beforeUpload,
  getBase64,
  imageRequest,
} from "../../helpers/image-actions";
import {
  HomeFilled,
  PlusSquareOutlined,
  PlusOutlined,
  LoadingOutlined,
  CompassOutlined,
  EditOutlined,
} from "@ant-design/icons";
import AccountAPI from "../../api/account";

const Template = ({ user, children }) => {
  const [openAdd, setOpenAdd] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const onAddClick = () => {
    if (!user) window.location.href = "/login";
    else setOpenAdd(true);
  };

  const postPost = () => {
    setLoading(true);
    if (!imageUrl || !description) {
      setLoading(false);
      return notification.error({
        message: "Please provide an image AND a description",
        placement: "bottomRight",
      });
    }
    AccountAPI.createPost({ encoded_img: imageUrl, description }, (success) => {
      setLoading(false);
      if (!success)
        return notification.error({
          message: "Failed to create post",
          placement: "bottomRight",
        });
      setOpenAdd(false);
      window.location.reload()
      return notification.success({
        message: "Posted!",
        placement: "bottomRight",
      });
    });
  };

  const postStory = () => {
    setLoading(true);
    if (!imageUrl) {
      setLoading(false);
      return notification.error({
        message: "Please provide an image",
        placement: "bottomRight",
      });
    }
    AccountAPI.createStory({ encoded_img: imageUrl }, (success) => {
      setLoading(false);
      if (!success)
        return notification.error({
          message: "Failed to create story",
          placement: "bottomRight",
        });
      setOpenAdd(false);
      window.location.reload()
      return notification.success({
        message: "Posted!",
        placement: "bottomRight",
      });
    });
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Media Image</div>
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

  return (
    <Fragment>
      <div>
        <div id="template-header-bar">
          <div id="inner-template-bar">
            <a href="/">
              <h1 id="template-logo">Autogram</h1>
            </a>
            <div className="spacer" />
            <a href="/" className="header-icon-link">
              <HomeFilled className="template-bar-icon" />
            </a>
            <PlusSquareOutlined
              className="template-bar-icon"
              onClick={onAddClick}
            />
            <a href="/explore" className="header-icon-link">
              <CompassOutlined className="template-bar-icon" />
            </a>
            {!user ? (
              <Button
                id="template-login-btn"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </Button>
            ) : (
              <a href={`/profile/${user.username}`}>
                <img id="template-profile-img" src={user.image} />
              </a>
            )}
          </div>
        </div>
        <div id="template-body">{children}</div>
      </div>
      <Modal
        title="Create Post/Story"
        visible={openAdd}
        onCancel={() => !loading && setOpenAdd(false)}
        centered
        footer={[
          <Button
            key="cancel"
            onClick={() => setOpenAdd(false)}
            loading={loading}
            disabled={loading}
          >
            Cancel
          </Button>,
          <Button
            key="post_post"
            type="primary"
            onClick={postPost}
            loading={loading}
            disabled={loading}
          >
            Create Post
          </Button>,
          <Button
            key="post_story"
            type="primary"
            onClick={postStory}
            loading={loading}
            disabled={loading}
          >
            Create Story
          </Button>,
        ]}
      >
        <Upload
          customRequest={imageRequest}
          listType="picture-card"
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          className="template-add-modal"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="avatar" style={{ width: "100%" }} />
          ) : (
            uploadButton
          )}
        </Upload>
        <Input
          prefix={<EditOutlined />}
          placeholder="Description (post only)"
          onChange={({ target: { value } }) => setDescription(value)}
        />
      </Modal>
    </Fragment>
  );
};

export default Template;
