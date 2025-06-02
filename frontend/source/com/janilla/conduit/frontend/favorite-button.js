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

export default class FavoriteButton extends WebComponent {

	static get observedAttributes() {
		return ["data-active", "data-count", "data-preview"];
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
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = async event => {
		// console.log("FavoriteButton.handleClick", event);
		event.stopPropagation();
		const rl = this.closest("root-layout");
		if (!rl.state.currentUser) {
			location.hash = "#/login";
			return;
		}
		const u = new URL(rl.dataset.apiUrl);
		u.pathname += `/articles/${this.dataset.slug}/favorite`;
		const r = await fetch(u, {
			method: this.dataset.active != null ? "DELETE" : "POST",
			headers: rl.state.apiHeaders
		});
		if (r.ok) {
			this.dispatchEvent(new CustomEvent("toggle-favorite", {
				bubbles: true,
				detail: await r.json()
			}));
		}
	}

	async updateDisplay() {
		// console.log("FavoriteButton.updateDisplay");
		const a = this.dataset.active != null;
		const p = this.dataset.preview != null;
		this.appendChild(this.interpolateDom({
			$template: "",
			...this.dataset,
			primary: a ? "btn-primary" : "btn-outline-primary",
			pull: p ? "pull-xs-right" : null,
			content: p ? {
				$template: "preview-content",
				...this.dataset
			} : {
				$template: "content",
				text: `${this.dataset.active != null ? "Unfavorite" : "Favorite"} Article`,
				count: `(${this.dataset.count})`
			}
		}));
	}
}
