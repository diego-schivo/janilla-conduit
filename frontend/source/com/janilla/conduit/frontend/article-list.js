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

export default class ArticleList extends FlexibleElement {

	static get observedAttributes() {
		return ["data-href"];
	}

	static get templateName() {
		return "article-list";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ArticleList.connectedCallback");
		super.connectedCallback();
		this.addEventListener("select-page", this.handleSelectPage);
	}

	disconnectedCallback() {
		// console.log("ArticleList.disconnectedCallback");
		this.removeEventListener("select-page", this.handleSelectPage);
	}

	handleSelectPage = event => {
		// console.log("ArticleList.handleSelectPage", event);
		this.pageNumber = event.detail.pageNumber;
		this.requestUpdate();
	}

	async update() {
		// console.log("ArticleList.update");
		await super.update();
		this.interpolate ??= this.createInterpolateDom();
		this.loadingContent ??= this.createInterpolateDom(1);
		this.emptyContent ??= this.createInterpolateDom(2);
		this.nonemptyContent ??= this.createInterpolateDom(3);
		this.appendChild(this.interpolate({ content: this.loadingContent() }));
		if (this.dataset.href) {
			const u = new URL(this.dataset.href);
			u.searchParams.append("skip", ((this.pageNumber ?? 1) - 1) * 10);
			u.searchParams.append("limit", 10);
			const j = await (await fetch(u, { headers: this.closest("conduit-app").apiHeaders })).json();
			// console.log("ArticleList.update", j);
			this.articles = j.articles;
			this.articlesCount = j.articlesCount;
			this.pageNumber = 1;
		} else {
			this.articles = null;
			this.articlesCount = null;
			this.pageNumber = null;
		}
		this.appendChild(this.interpolate({
			content: this.articles?.length
				? this.nonemptyContent({
					previews: (() => {
						if (this.previews?.length !== this.articles.length)
							this.previews = this.articles.map(_ => this.createInterpolateDom(4));
						return this.previews.map((x, i) => x({ index: i }));
					})(),
					pagesCount: this.articlesCount != null ? Math.ceil(this.articlesCount / 10) : null,
					pageNumber: this.pageNumber
				})
				: this.emptyContent()
		}));
	}
}
