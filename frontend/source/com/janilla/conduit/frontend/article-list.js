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
		this.attachShadow({ mode: "open" });
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

	async updateDisplay() {
		// console.log("ArticleList.updateDisplay");
		await super.updateDisplay();
		this.interpolate ??= this.createInterpolateDom();
		this.shadowRoot.appendChild(this.interpolate());
		this.interpolateContent ??= this.createInterpolateDom("content");
		this.appendChild(this.interpolateContent({ loadingSlot: "content" }));
		if (this.dataset.href) {
			const u = new URL(this.dataset.href);
			u.searchParams.append("skip", ((this.pageNumber ?? 1) - 1) * 10);
			u.searchParams.append("limit", 10);
			const j = await (await fetch(u, { headers: this.closest("conduit-app").apiHeaders })).json();
			// console.log("ArticleList.updateDisplay", j);
			this.articles = j.articles;
			this.articlesCount = j.articlesCount;
		} else {
			this.articles = [];
			this.articlesCount = 0;
		}
		this.pageNumber = 1;
		this.appendChild(this.interpolateContent({
			emptySlot: this.articles.length ? null : "content",
			nonemptySlot: this.articles.length ? "content" : null,
			previews: (() => {
				if (this.previews?.length !== this.articles.length)
					this.previews = this.articles.map(_ => this.createInterpolateDom("preview"));
				return this.previews.map((x, i) => x({ index: i }));
			})(),
			pagination: (() => {
				this.interpolatePagination ??= this.createInterpolateDom("pagination");
				const pc = Math.ceil(this.articlesCount / 10);
				return pc > 1 ? this.interpolatePagination({
					pagesCount: pc,
					pageNumber: this.pageNumber
				}) : null;
			})()
		}));
	}
}
