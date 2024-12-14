/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
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
import { SlottableElement } from "./slottable-element.js";
import { formatMarkdownAsHTML, parseMarkdown } from "./markdown.js";

export default class ArticlePage extends SlottableElement {

	static get observedAttributes() {
		return ["data-slug", "slot"];
	}

	static get templateName() {
		return "article-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ArticlePage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("add-comment", this.handleAddComment);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("remove-comment", this.handleRemoveComment);
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
		this.addEventListener("toggle-follow", this.handleToggleFollow);
	}

	disconnectedCallback() {
		// console.log("ArticlePage.disconnectedCallback");
		this.removeEventListener("add-comment", this.handleAddComment);
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("remove-comment", this.handleRemoveComment);
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
		this.removeEventListener("toggle-follow", this.handleToggleFollow);
	}

	handleAddComment = event => {
		// console.log("ArticlePage.handleAddComment", event);
		this.state.comments.unshift(event.detail.comment);
		this.querySelector("comment-list").requestUpdate();
	}

	handleClick = async event => {
		// console.log("ArticlePage.handleClick", event);
		const el = event.target.closest(".article-meta a:not([href]), .article-meta button");
		if (!el)
			return;
		event.preventDefault();
		switch (el.tagName.toLowerCase()) {
			case "a":
				location.hash = `#/editor/${this.state.article.slug}`;
				break;
			case "button":
				const ca = this.closest("conduit-app");
				const u = new URL(ca.dataset.apiUrl);
				u.pathname += `/articles/${this.state.article.slug}`;
				const r = await fetch(u, {
					method: "DELETE",
					headers: ca.apiHeaders
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
		this.querySelector("comment-list").requestUpdate();
	}

	handleToggleFavorite = event => {
		// console.log("ArticlePage.handleToggleFavorite", event);
		this.state.article = event.detail.article;
		this.requestUpdate();
	}

	handleToggleFollow = event => {
		// console.log("ArticlePage.handleToggleFollow", event);
		this.state.article.author = event.detail.profile;
		this.requestUpdate();
	}

	async computeState() {
		// console.log("ArticlePage.computeState");
		const ca = this.closest("conduit-app");
		const uu = Array.from({ length: 2 }, _ => new URL(ca.dataset.apiUrl));
		uu[0].pathname += `/articles/${this.dataset.slug}`;
		uu[1].pathname += `/articles/${this.dataset.slug}/comments`;
		const [{ article }, { comments }] = await Promise.all(uu.map(x => fetch(x, { headers: ca.apiHeaders }).then(y => y.json())));
		article.bodyHtml = (() => {
			const t = document.createElement("template");
			t.innerHTML = formatMarkdownAsHTML(parseMarkdown(article.body));
			return t.content;
		})();
		return { article, comments };
	}

	renderState() {
		// console.log("ArticlePage.renderState");
		this.interpolate ??= this.createInterpolateDom();
		this.content ??= this.createInterpolateDom(1);
		this.meta ??= Array.from({ length: 2 }, _ => this.createInterpolateDom(2));
		this.canModify ??= Array.from({ length: 2 }, _ => this.createInterpolateDom(3));
		this.cannotModify ??= Array.from({ length: 2 }, _ => this.createInterpolateDom(4));
		const a = this.state?.article;
		const ca = this.closest("conduit-app");
		this.appendChild(this.interpolate({
			content: this.slot && a ? this.content({
				...a,
				meta1: this.meta[0]({
					...a,
					content: a.author.username === ca.currentUser?.username ? this.canModify[0]() : this.cannotModify[0](a)
				}),
				tags: (() => {
					if (this.tags?.length !== a.tagList.length)
						this.tags = a.tagList.map(_ => this.createInterpolateDom(5));
					return this.tags.map((x, i) => x(a.tagList[i]));
				})(),
				meta2: this.meta[1]({
					...a,
					content: a.author.username === ca.currentUser?.username ? this.canModify[1]() : this.cannotModify[1](a)
				}),
			}) : null
		}));
	}
}
