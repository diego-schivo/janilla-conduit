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

export default class EditorPage extends UpdatableHTMLElement {

	static get observedAttributes() {
		return ["slot"];
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
		const s = history.state?.["editor-page"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("EditorPage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		// console.log("EditorPage.handleSubmit", event);
		event.preventDefault();
		const rl = this.closest("root-layout");
		const u = new URL(rl.dataset.apiUrl);
		u.pathname += this.dataset.slug ? `/articles/${this.dataset.slug}` : "/articles";
		const fd = new FormData(event.target);
		const a = [...fd.entries()].reduce((x, y) => {
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
		}, {});
		const r = await fetch(u, {
			method: this.dataset.slug ? "PUT" : "POST",
			headers: {
				...rl.state.apiHeaders,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ article: a })
		});
		const j = await r.json();
		this.state.errorMessages = !r.ok && j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
		if (r.ok)
			location.hash = `#/article/${j.article.slug}`;
		else
			this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("EditorPage.updateDisplay");
		const s = this.state;
		const rl = this.closest("root-layout");
		if (!s.article || this.dataset.slug != s.article.slug) {
			const o = { version: (s.version ?? 0) + 1 };
			if (this.dataset.slug) {
				const u = new URL(rl.dataset.apiUrl);
				u.pathname += `/articles/${this.dataset.slug}`;
				const j = await (await fetch(u, { headers: rl.state.apiHeaders })).json();
				o.article = j.article;
			} else
				o.article = {};
			history.replaceState({
				...history.state,
				"editor-page": o
			}, "");
			Object.assign(s, o);
			this.closest("page-display").requestUpdate();
			return;
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			...s.article,
			tagList: s.article.tagList?.join(),
			errorMessages: this.state.errorMessages?.join(";")
		}));
	}
}
