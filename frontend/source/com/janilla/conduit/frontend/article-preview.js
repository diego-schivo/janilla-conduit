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

export default class ArticlePreview extends WebComponent {

	static get observedAttributes() {
		return ["data-index", "data-slug"];
	}

	static get templateNames() {
		return ["article-preview"];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ArticlePreview.connectedCallback");
		super.connectedCallback();
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	disconnectedCallback() {
		// console.log("ArticlePreview.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	handleToggleFavorite = event => {
		// console.log("ArticlePreview.handleToggleFavorite", event);
		this.closest("article-list").state.articles[parseInt(this.dataset.index)] = event.detail.article;
		this.requestDisplay();
	}

	async updateDisplay() {
		// console.log("ArticlePreview.updateDisplay", this.dataset.index);
		const a = this.closest("article-list").state.articles[parseInt(this.dataset.index)];
		this.appendChild(this.interpolateDom({
			$template: "",
			...a,
			authorHref: `#/@${a.author.username}`,
			href: `#/article/${a.slug}`,
			tagItems: a.tagList.map(x => ({
				$template: "tag-item",
				text: x
			}))
		}));
	}
}
