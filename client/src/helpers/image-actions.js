import { notification } from "antd";

/**
 * Dummy request to mimic an API POST
 * Used to silence errors and uplaod the image to AWS S3.
 * @param {Object} input
 */
export const imageRequest = (input) => {
  setTimeout(() => input.onSuccess("ok"), 0);
};

/**
 * Get the base64 representation of an image
 * @param {Blob} img
 * @param {Function} callback
 */
export const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

/**
 * Actions before upload to verify image
 * @param {Object} file
 * @returns {boolean}
 */
export const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng)
    notification.error({
      message: "You can only upload JPG/PNG file!",
      placement: "bottomRight",
    });
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M)
    notification.error({
      message: "Image must smaller than 2MB!",
      placement: "bottomRight",
    });
  return isJpgOrPng && isLt2M;
};
