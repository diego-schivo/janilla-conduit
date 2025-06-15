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
import WebComponent from "./web-component.js";
import { formatMarkdownAsHtml, parseMarkdown } from "./markdown.js";

export default class ArticlePage extends WebComponent {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateNames() {
		return ["article-page"];
	}

	constructor() {
		super();
	}

	get historyState() {
		const s = this.state;
		return {
			...history.state,
			"article-page": Object.fromEntries(["article", "comments"].map(x => [x, s[x]]))
		};
	}

	connectedCallback() {
		// console.log("ArticlePage.connectedCallback");
		super.connectedCallback();
		const s = history.state?.["article-page"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("add-comment", this.handleAddComment);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("remove-comment", this.handleRemoveComment);
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
		this.addEventListener("toggle-follow", this.handleToggleFollow);
	}

	disconnectedCallback() {
		// console.log("ArticlePage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("add-comment", this.handleAddComment);
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("remove-comment", this.handleRemoveComment);
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
		this.removeEventListener("toggle-follow", this.handleToggleFollow);
	}

	handleAddComment = event => {
		// console.log("ArticlePage.handleAddComment", event);
		this.state.comments.unshift(event.detail.comment);
		history.replaceState(this.historyState, "");
		this.querySelector("comment-list").requestDisplay();
	}

	handleClick = async event => {
		// console.log("ArticlePage.handleClick", event);
		const el = event.target.closest(".article-meta a:not([href]), .article-meta button");
		if (!el)
			return;
		event.preventDefault();
		switch (el.tagName.toLowerCase()) {
			case "a":
				location.hash = `#/editor/${this.dataset.slug}`;
				break;
			case "button":
				const rl = this.closest("root-layout");
				const u = new URL(rl.dataset.apiUrl);
				u.pathname += `/articles/${this.dataset.slug}`;
				const r = await fetch(u, {
					method: "DELETE",
					headers: rl.state.apiHeaders
				});
				if (r.ok)
					location.hash = "#/";
				break;
		}
	}

	handleRemoveComment = event => {
		// console.log("ArticlePage.handleRemoveComment", event);
		const cc = this.state.comments;
		const i = cc.findIndex(x => x === event.detail.comment);
		cc.splice(i, 1);
		history.replaceState(this.historyState, "");
		this.querySelector("comment-list").requestDisplay();
	}

	handleToggleFavorite = event => {
		// console.log("ArticlePage.handleToggleFavorite", event);
		this.state.article = event.detail.article;
		this.requestDisplay();
	}

	handleToggleFollow = event => {
		// console.log("ArticlePage.handleToggleFollow", event);
		this.state.article.author = event.detail.profile;
		this.requestDisplay();
	}

	async updateDisplay() {
		// console.log("ArticlePage.updateDisplay");
		const s = this.state;
		const rl = this.closest("root-layout");
		if (!s.article || this.dataset.slug != s.article.slug) {
			const uu = Array.from({ length: 2 }, () => new URL(rl.dataset.apiUrl));
			uu[0].pathname += `/articles/${this.dataset.slug}`;
			uu[1].pathname += `/articles/${this.dataset.slug}/comments`;
			const [j1, j2] = await Promise.all(uu.map(x => {
				const p = fetch(x, { headers: rl.state.apiHeaders }).then(y => y.json());
				return p;
			}));
			s.article = j1.article;
			s.comments = j2.comments;
			history.replaceState(this.historyState, "");
			this.closest("page-display").requestDisplay();
			return;
		}
		s.body ??= (() => {
			const t = document.createElement("template");
			t.innerHTML = formatMarkdownAsHtml(parseMarkdown(s.article.body));
			return t.content;
		})();
		this.appendChild(this.interpolateDom({
			$template: "",
			...s.article,
			body: s.body,
			comments: s.comments,
			meta: Array.from({ length: 2 }, () => ({
				$template: "meta",
				...s.article,
				content: s.article.author.username === rl.state.currentUser?.username
					? ({ $template: "can-modify" })
					: ({
						$template: "cannot-modify",
						...s.article
					})
			})),
			tagItems: s.article.tagList.map(x => ({
				$template: "tag-item",
				text: x
			}))
		}));
	}
}
