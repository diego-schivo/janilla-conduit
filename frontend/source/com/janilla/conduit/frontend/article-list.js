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
import { UpdatableHTMLElement } from "./updatable-html-element.js";

export default class ArticleList extends UpdatableHTMLElement {

	static get observedAttributes() {
		return ["data-api-url"];
	}

	static get templateName() {
		return "article-list";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	get historyState() {
		const s = this.state;
		return {
			...history.state,
			"article-list": Object.fromEntries(["apiUrl", "articles", "pagesCount", "pageNumber"].map(x => [x, s[x]]))
		};
	}

	connectedCallback() {
		// console.log("ArticleList.connectedCallback");
		super.connectedCallback();
		const s = history.state?.["article-list"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("select-page", this.handleSelectPage);
	}

	disconnectedCallback() {
		// console.log("ArticleList.disconnectedCallback");
		this.removeEventListener("select-page", this.handleSelectPage);
	}

	handleSelectPage = event => {
		// console.log("ArticleList.handleSelectPage", event);
		dispatchEvent(new CustomEvent("popstate"));
		const s = this.state;
		s.apiUrl = null;
		s.pageNumber = event.detail.pageNumber;
		history.pushState(this.historyState, "");
		this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("ArticleList.updateDisplay");
		this.shadowRoot.appendChild(this.interpolateDom({ $template: "shadow" }));
		const s = this.state;
		if (this.dataset.apiUrl != s.apiUrl) {
			this.appendChild(this.interpolateDom({
				$template: "",
				loadingSlot: "content"
			}));
			const u = new URL(this.dataset.apiUrl);
			const pn = s.pageNumber ?? 1;
			u.searchParams.append("skip", (pn - 1) * 10);
			u.searchParams.append("limit", 10);
			const j = await (await fetch(u, { headers: this.closest("root-layout").state.apiHeaders })).json();
			s.apiUrl = this.dataset.apiUrl;
			s.articles = j.articles;
			s.pagesCount = Math.ceil(j.articlesCount / 10);
			s.pageNumber = pn;
			history.replaceState(this.historyState, "");
		}
		// console.log("ArticleList.updateDisplay", s);
		this.appendChild(this.interpolateDom({
			$template: "",
			emptySlot: s.articles.length ? null : "content",
			slot: s.articles.length ? "content" : null,
			previews: s.articles.map(({ slug }, index) => ({
				$template: "preview",
				index,
				slug
			})),
			pagination: s.pagesCount > 1 ? this.interpolateDom({
				$template: "pagination",
				...s
			}) : null
		}));
	}
}
