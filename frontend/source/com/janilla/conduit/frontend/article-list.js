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
		return ["data-api-href"];
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
		if (!this.isConnected)
			return;
		this.shadowRoot.appendChild(this.interpolateDom());
		if (this.dataset.apiHref) {
			const u = new URL(this.dataset.apiHref);
			u.searchParams.append("skip", ((this.pageNumber ?? 1) - 1) * 10);
			u.searchParams.append("limit", 10);
			if (u.href === this.apiUrl?.href)
				return;
			this.apiUrl = u;
			this.appendChild(this.interpolateDom({
				$template: "content",
				loadingSlot: "content"
			}));
			const j = await (await fetch(u, { headers: this.closest("conduit-app").apiHeaders })).json();
			// console.log("ArticleList.updateDisplay", j);
			this.articles = j.articles;
			this.pagesCount = Math.ceil(j.articlesCount / 10);
			this.pageNumber = 1;
		} else {
			this.articles = [];
			this.pagesCount = 0;
			this.pageNumber = 0;
		}
		// console.log("ArticleList.updateDisplay", this.dataset.apiHref, this.articles, this.articlesCount);
		this.appendChild(this.interpolateDom({
			$template: "content",
			emptySlot: this.articles.length ? null : "content",
			nonemptySlot: this.articles.length ? "content" : null,
			previews: this.articles.map((_, i) => ({
				$template: "preview",
				index: i
			})),
			pagination: this.pagesCount > 1 ? this.interpolateDom({
				$template: "pagination",
				pagesCount: this.pagesCount,
				pageNumber: this.pageNumber
			}) : null
		}));
	}
}
