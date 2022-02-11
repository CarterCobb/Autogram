import axios from "axios";
import SecureLS from "secure-ls";

export const ls = new SecureLS({ encodingType: "aes" });

// EDIT THIS VARIABLE
const API_URL = "PASTE YOUR AWS API GATEWAY URL HERE";
// 

export default class AccountAPI {
  /**
   * Gets the currently logged in user
   * @param {Function} cb callback function (user)
   */
  static async getUser(cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const get = await axios.get(`${API_URL}/account`, {
        headers: {
          Authorization: token,
        },
      });
      if (get.data.error) return cb(null);
      return cb(get.data);
    } else return cb(null);
  }

  /**
   * Gets an account by the username
   * @param {String} id
   * @param {Function} cb (profile)
   */
  static async getUserByUsername(id, cb) {
    const get = await axios.get(`${API_URL}/account?username=${id}`);
    if (get.data.error) return cb({});
    return cb(get.data || {});
  }

    /**
   * Gets all accounts
   * @param {Function} cb (profiles: arr)
   */
     static async getAllAccounts(cb) {
      const get = await axios.get(`${API_URL}/account?explore=true`);
      if (get.data.error) return cb([]);
      return cb(get.data || []);
    }

  /**
   * Logs in the user
   * @param {Object} payload
   * @param {Function} cb (success: bool)
   */
  static async login(payload, cb) {
    const post = await axios.post(`${API_URL}/login`, JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
    if (post.data.accessToken) {
      ls.set("746f6b656e", post.data.accessToken);
      return cb(true);
    }
    return cb(false);
  }

  /**
   * Log out of the system
   */
  static logout() {
    ls.remove("746f6b656e");
    window.location.href = "/login";
  }

  /**
   * Register a new user
   * @param {Object} payload
   * @param {Function} cb (success: bool)
   */
  static async register(payload, cb) {
    const post = await axios.post(
      `${API_URL}/account`,
      JSON.stringify(payload),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    if (post.data.error) return cb(post.data);
    AccountAPI.login(
      { email: payload.email, password: payload.password },
      (logged_in) => {
        if (logged_in) return cb(true);
        return cb({ error: "Failed to login" });
      }
    );
  }

  /**
   * Gets a random amount up to 5 accounts to suggest
   * @param {Function} cb (accounts)
   */
  static async getSuggestions(cb) {
    const get = await axios.get(`${API_URL}/account?suggestion=true`);
    if (get.data.error) return cb([]);
    return cb(get.data);
  }

  /**
   * Follow an account
   * @param {String} id
   * @param {Function} cb (successful: bool)
   */
  static async followAccount(id, cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const put = await axios.put(
        `${API_URL}/account?follow=true&id=${id}`,
        JSON.stringify({}),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      console.log(put.data);
      if (put.data.error) return cb(false);
      return cb(true);
    } else return cb(false);
  }

  /**
   * Unfollow an account
   * @param {String} id
   * @param {Function} cb (successful: bool)
   */
  static async unfollowAccount(id, cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const put = await axios.put(
        `${API_URL}/account?unfollow=true&id=${id}`,
        JSON.stringify({}),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      if (put.data.error) return cb(false);
      return cb(true);
    } else return cb(false);
  }

  /**
   * Gets all the posts from followed users
   * @param {Object} user
   * @param {Function} cb (posts: arr)
   */
  static async getPostsfromFollows(user, cb) {
    const accounts = await axios.get(
      `${API_URL}/account?ids=${JSON.stringify([...user.following, user.id])}`
    );
    if (accounts.data.error) return cb([]);
    const posts = [];
    for (var account of accounts.data)
      for (var post of account.posts) {
        post = JSON.parse(post);
        post.account = account;
        posts.push(post);
      }
    return cb(
      posts.sort((a, b) =>
        new Date(a.posted_at) < new Date(b.posted_at) ? 1 : -1
      )
    );
  }

  /**
   * Gets all the stories from followed users
   * @param {Object} user
   * @param {Function} cb (stories: arr)
   */
  static async getStoriesFromFollows(user, cb) {
    const accounts = await axios.get(
      `${API_URL}/account?ids=${JSON.stringify([user.id, ...user.following])}`
    );
    if (accounts.data.error) return cb([]);
    const stories = [];
    for (var account of accounts.data) {
      const account_stories = [];
      for (var story of account.stories) {
        story = JSON.parse(story);
        story.account = account;
        if (!story.deleted) account_stories.push(story);
      }
      if (account_stories.length > 0)
        stories.push(
          account_stories.sort((a, b) =>
            new Date(a.posted_at) < new Date(b.posted_at) ? 1 : -1
          )
        );
    }
    return cb(stories);
  }

  /**
   * Create a post
   * @param {Object} payload {encoded_img: "", description: ""}
   * @param {Function} cb (success)
   */
  static async createPost(payload, cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const put = await axios.put(
        `${API_URL}/account?action_type=create_post`,
        JSON.stringify(payload),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      if (put.data.error) return cb(false);
      return cb(true);
    } else return cb(false);
  }

  /**
   *
   * @param {Object} payload {encoded_img: ""}
   * @param {Function} cb (success: bool)
   */
  static async createStory(payload, cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const put = await axios.put(
        `${API_URL}/account?action_type=create_story`,
        JSON.stringify(payload),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      if (put.data.error) return cb(false);
      return cb(true);
    } else return cb(false);
  }

  /**
   * Updates a profile
   * @param {Object} payload
   * @param {Function} cb (success: boll)
   */
  static async updateUser(payload, cb) {
    const token = ls.get("746f6b656e");
    if (token) {
      const put = await axios.patch(
        `${API_URL}/account`,
        JSON.stringify(payload),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      if (put.data.error) return cb(false);
      return cb(true);
    } else return cb(false);
  }
}
