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

export default class EditorPage extends SlottableElement {

	static get observedAttributes() {
		return ["data-slug", "slot"];
	}

	static get templateName() {
		return "editor-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("EditorPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("EditorPage.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		// console.log("EditorPage.handleSubmit", event);
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += this.dataset.slug ? `/articles/${this.dataset.slug}` : "/articles";
		const r = await fetch(u, {
			method: this.dataset.slug ? "PUT" : "POST",
			headers: { ...ca.apiHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({
				article: [...new FormData(event.target).entries()].reduce((x, y) => {
					switch (y[0]) {
						case "tagList":
							x.tagList ??= [];
							x.tagList.push(y[1]);
							break;
						default:
							x[y[0]] = y[1];
							break;
					}
					return x;
				}, {})
			})
		});
		const j = await r.json();
		if (r.ok)
			location.hash = `#/article/${j.article.slug}`;
		else {
			this.errorMessages = j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
			this.requestUpdate();
		}
	}

	async computeState() {
		// console.log("EditorPage.computeState");
		if (!this.dataset.slug) {
			await super.computeState();
			return;
		}
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${this.dataset.slug}`;
		this.state = await (await fetch(u, { headers: ca.apiHeaders })).json();
	}

	renderState() {
		// console.log("EditorPage.renderState");
		this.appendChild(this.interpolateDom({
			$template: "",
			content: this.state?.article ? {
				$template: "content",
				...this.state.article,
				tagList: this.state?.tagList?.join(),
				errorMessages: this.errorMessages
			} : null
		}));
	}
}
