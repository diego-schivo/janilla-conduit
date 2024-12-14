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

export default class FavoriteButton extends FlexibleElement {

	static get observedAttributes() {
		return ["data-active", "data-count"];
	}

	static get templateName() {
		return "favorite-button";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("FavoriteButton.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("FavoriteButton.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = async event => {
		// console.log("FavoriteButton.handleClick", event);
		event.stopPropagation();
		const ca = this.closest("conduit-app");
		if (!ca.currentUser) {
			location.hash = "#/login";
			return;
		}
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${this.dataset.slug}/favorite`;
		const r = await fetch(u, {
			method: this.dataset.active === "true" ? "DELETE" : "POST",
			headers: ca.apiHeaders
		});
		if (r.ok) {
			const j = await r.json();
			this.dispatchEvent(new CustomEvent("toggle-favorite", {
				bubbles: true,
				detail: j
			}));
		}
	}

	async update() {
		// console.log("FavoriteButton.update");
		await super.update();
		this.interpolate ??= this.createInterpolateDom();
		this.previewContent ??= this.createInterpolateDom(1);
		this.content ??= this.createInterpolateDom(2);
		this.appendChild(this.interpolate({
			...this.dataset,
			class: `btn btn-sm ${this.dataset.active === "true" ? "btn-primary" : "btn-outline-primary"} ${this.dataset.preview === "true" ? "pull-xs-right" : ""}`,
			content: this.dataset.preview === "true"
				? this.previewContent(this.dataset)
				: this.content({
					text: `${this.dataset.active === "true" ? 'Unfavorite' : 'Favorite'} Article`,
					count: `(${this.dataset.count})`
				})
		}));
	}
}
