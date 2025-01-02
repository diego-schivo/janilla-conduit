/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import ArticleList from "./article-list.js";
import ArticlePage from "./article-page.js";
import ArticlePreview from "./article-preview.js";
import CommentList from "./comment-list.js";
import ConduitApp from "./conduit-app.js";
import EditorPage from "./editor-page.js";
import ErrorList from "./error-list.js";
import FavoriteButton from "./favorite-button.js";
import FollowButton from "./follow-button.js";
import HomePage from "./home-page.js";
import IntlFormat from "./intl-format.js";
import LoginPage from "./login-page.js";
import NavLink from "./nav-link.js";
import PageDisplay from "./page-display.js";
import PaginationNav from "./pagination-nav.js";
import PopularTags from "./popular-tags.js";
import ProfilePage from "./profile-page.js";
import RegisterPage from "./register-page.js";
import SettingsPage from "./settings-page.js";
import TagsInput from "./tags-input.js";

customElements.define("article-list", ArticleList);
customElements.define("article-page", ArticlePage);
customElements.define("article-preview", ArticlePreview);
customElements.define("comment-list", CommentList);
customElements.define("conduit-app", ConduitApp);
customElements.define("editor-page", EditorPage);
customElements.define("error-list", ErrorList);
customElements.define("favorite-button", FavoriteButton);
customElements.define("follow-button", FollowButton);
customElements.define("home-page", HomePage);
customElements.define("intl-format", IntlFormat);
customElements.define("login-page", LoginPage);
customElements.define("nav-link", NavLink);
customElements.define("page-display", PageDisplay);
customElements.define("pagination-nav", PaginationNav);
customElements.define("popular-tags", PopularTags);
customElements.define("profile-page", ProfilePage);
customElements.define("register-page", RegisterPage);
customElements.define("settings-page", SettingsPage);
customElements.define("tags-input", TagsInput);
