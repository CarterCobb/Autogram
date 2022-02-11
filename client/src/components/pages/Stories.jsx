import React from "react";
import { CloseOutlined } from "@ant-design/icons";
import ReactCarousel, { AFTER, CENTER, BEFORE } from "react-carousel-animated";
import { MdVerified } from "react-icons/md";
import { prettyDate } from "../../helpers/functions";
import "react-carousel-animated/dist/style.css";
import "../../styles/stories.css";

const Stories = ({ stories, index, close }) => {
  const concated_arrays = [].concat(...stories);
  const items = [
    concated_arrays[index],
    ...concated_arrays.filter((s) => s.id !== concated_arrays[index].id),
  ];
  return (
    <div id="stories-main">
      <div id="story-header-bar">
        <h1 id="stories-logo">Autogram</h1>
        <div className="spacer" />
        <CloseOutlined id="stories-close-btn" onClick={close} />
      </div>
      <ReactCarousel
        carouselConfig={{
          transform: {
            rotateY: {
              [BEFORE]: () => "rotateY(0deg)",
              [CENTER]: () => "rotateY(0deg)",
              [AFTER]: () => "rotateY(0deg)",
            },
          },
        }}
        carouselHeight={window.innerHeight - 70}
      >
        {items.map((story, i) => (
          <div className="story-container" key={i}>
            <div className="story-header">
              <a href={`/profile/${story.account.username}`}>
                <img src={story.account.image} className="story-header-img" />
              </a>
              <div>
                <h3 className="story-header-username">
                  {story.account.username}{" "}
                  {story.account.permissions.is_verified && (
                    <MdVerified color="#3897f0" />
                  )}
                </h3>
                <p className="story-header-username">
                  {prettyDate(story.posted_at)}
                </p>
              </div>
              <div className="spacer" />
            </div>
            <img src={story.image} style={{ width: "100%", height: "auto" }} />
          </div>
        ))}
      </ReactCarousel>
    </div>
  );
};

export default Stories;
