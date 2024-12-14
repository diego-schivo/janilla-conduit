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
import { FlexibleElement } from "./flexible-element.js";

export default class ArticlePreview extends FlexibleElement {

	static get observedAttributes() {
		return ["data-index"];
	}

	static get templateName() {
		return "article-preview";
	}

	constructor() {
		super();
	}

	get article() {
		return this.closest("article-list")?.articles[parseInt(this.dataset.index)];
	}

	set article(x) {
		this.closest("article-list").articles[parseInt(this.dataset.index)] = x;
	}

	connectedCallback() {
		// console.log("ArticlePreview.connectedCallback");
		super.connectedCallback();
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	disconnectedCallback() {
		// console.log("ArticlePreview.disconnectedCallback");
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	handleToggleFavorite = event => {
		// console.log("ArticlePreview.handleToggleFavorite", event);
		this.article = event.detail.article;
		this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("ArticlePreview.updateDisplay");
		await super.updateDisplay();
		this.interpolate ??= this.createInterpolateDom();
		this.content ??= this.createInterpolateDom(1);
		const a = this.article;
		this.appendChild(this.interpolate({
			content: a ? this.content({
				...a,
				authorHref: `#/@${a.author.username}`,
				href: `#/article/${a.slug}`,
				tags: (() => {
					if (this.tags?.length !== a.tagList.length)
						this.tags = a.tagList.map(_ => this.createInterpolateDom(2));
					return this.tags.map((x, i) => x(a.tagList[i]));
				})()
			}) : null
		}));
	}
}
