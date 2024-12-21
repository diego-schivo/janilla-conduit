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

export default class PopularTags extends FlexibleElement {

	static get templateName() {
		return "popular-tags";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		// console.log("PopularTags.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("PopularTags.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("PopularTags.handleClick", event);
		event.preventDefault();
		const el = event.target.closest(".tag-default");
		if (!el)
			return;
		this.dispatchEvent(new CustomEvent("select-tag", {
			bubbles: true,
			detail: { tag: el.textContent.trim() }
		}));
	}

	async updateDisplay() {
		// console.log("PopularTags.updateDisplay");
		await super.updateDisplay();
		if (!this.isConnected)
			return;
		this.interpolate ??= this.createInterpolateDom();
		this.shadowRoot.appendChild(this.interpolate());
		this.interpolateContent ??= this.createInterpolateDom("content");
		this.tags ??= await (async () => {
			this.appendChild(this.interpolateContent({ loadingSlot: "content" }));
			const ca = this.closest("conduit-app");
			const u = new URL(ca.dataset.apiUrl);
			u.pathname += "/tags";
			const j = await (await fetch(u, { headers: ca.apiHeaders })).json();
			return j.tags;
		})();
		this.appendChild(this.interpolateContent({
			emptySlot: this.tags.length ? null : "content",
			nonemptySlot: this.tags.length ? "content" : null,
			tags: (() => {
				if (this.interpolateTags?.length !== this.tags.length)
					this.interpolateTags = this.tags.map(() => this.createInterpolateDom("tag"));
				return this.tags.map((x, i) => this.interpolateTags[i](x));
			})()
		}));
	}
}
